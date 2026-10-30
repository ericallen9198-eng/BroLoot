using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Text;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

[assembly: AssemblyTitle("BroLoot")]
[assembly: AssemblyDescription("Offline Windows loot profile editor")]
[assembly: AssemblyCompany("BroLoot")]
[assembly: AssemblyProduct("BroLoot")]
[assembly: AssemblyVersion("1.3.0.0")]
[assembly: AssemblyFileVersion("1.3.0.0")]

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new BroLootWindow());
    }
}

internal sealed class BroLootWindow : Form
{
    private const string AppOrigin = "https://broloot.local";
    private readonly WebView2 browser = new WebView2();
    private readonly Label loading = new Label();
    private readonly JavaScriptSerializer json = new JavaScriptSerializer { MaxJsonLength = 48 * 1024 * 1024, RecursionLimit = 100 };
    private readonly string dataDirectory = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "BroLoot");
    private string lastDirectory = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);

    public BroLootWindow()
    {
        Text = "BroLoot";
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(1200, 820);
        MinimumSize = new Size(820, 600);
        BackColor = Color.FromArgb(243, 245, 247);
        try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }
        loading.Text = "Opening BroLoot…";
        loading.Dock = DockStyle.Fill;
        loading.TextAlign = ContentAlignment.MiddleCenter;
        loading.Font = new Font("Segoe UI", 14);
        browser.Dock = DockStyle.Fill;
        browser.Visible = false;
        Controls.Add(browser);
        Controls.Add(loading);
        Shown += async (sender, e) => await StartEditor();
    }

    private async System.Threading.Tasks.Task StartEditor()
    {
        try
        {
            string webRoot = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "wwwroot");
            if (!File.Exists(Path.Combine(webRoot, "index.html")))
                throw new FileNotFoundException("The editor files are missing. Extract the entire BroLoot ZIP, then run BroLoot.exe inside the extracted folder.");
            Directory.CreateDirectory(dataDirectory);
            string savedFolder = Path.Combine(dataDirectory, "last-save-folder.txt");
            if (File.Exists(savedFolder))
            {
                string candidate = File.ReadAllText(savedFolder).Trim();
                if (Directory.Exists(candidate)) lastDirectory = candidate;
            }
            var environment = await CoreWebView2Environment.CreateAsync(null, Path.Combine(dataDirectory, "BrowserData"));
            await browser.EnsureCoreWebView2Async(environment);
            browser.CoreWebView2.SetVirtualHostNameToFolderMapping("broloot.local", webRoot, CoreWebView2HostResourceAccessKind.DenyCors);
            browser.CoreWebView2.Settings.IsStatusBarEnabled = false;
            browser.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            browser.CoreWebView2.Settings.IsWebMessageEnabled = true;
            browser.CoreWebView2.NavigationStarting += (sender, e) =>
            {
                if (IsAppUrl(e.Uri) || e.Uri == "about:blank") return;
                e.Cancel = true;
                if (e.IsUserInitiated) OpenExternal(e.Uri);
            };
            browser.CoreWebView2.NewWindowRequested += (sender, e) =>
            {
                e.Handled = true;
                if (e.IsUserInitiated) OpenExternal(e.Uri);
            };
            browser.CoreWebView2.WebMessageReceived += ReceiveMessage;
            browser.NavigationCompleted += (sender, e) =>
            {
                if (!e.IsSuccess) { loading.Text = "BroLoot could not load the local editor. Close and reopen the app."; return; }
                loading.Visible = false;
                browser.Visible = true;
                browser.Focus();
            };
            browser.CoreWebView2.Navigate(AppOrigin + "/index.html");
        }
        catch (WebView2RuntimeNotFoundException)
        {
            var answer = MessageBox.Show(this,
                "BroLoot needs Microsoft's free WebView2 Runtime. Install it once, then reopen BroLoot.\n\nOpen Microsoft's installer download?",
                "Install WebView2", MessageBoxButtons.YesNo, MessageBoxIcon.Information);
            if (answer == DialogResult.Yes) OpenExternal("https://go.microsoft.com/fwlink/p/?LinkId=2124703");
            Close();
        }
        catch (Exception ex)
        {
            try { Directory.CreateDirectory(dataDirectory); File.WriteAllText(Path.Combine(dataDirectory, "startup.log"), ex.ToString()); } catch { }
            MessageBox.Show(this, "BroLoot could not start.\n\n" + ex.Message, "BroLoot", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Close();
        }
    }

    private static bool IsAppUrl(string value)
    {
        Uri uri;
        return Uri.TryCreate(value, UriKind.Absolute, out uri) && uri.Scheme == "https" && uri.Host == "broloot.local" && uri.IsDefaultPort;
    }

    private static void OpenExternal(string value)
    {
        Uri uri;
        if (!Uri.TryCreate(value, UriKind.Absolute, out uri) || (uri.Scheme != "https" && uri.Scheme != "http")) return;
        try { Process.Start(new ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true }); } catch { }
    }

    private void ReceiveMessage(object sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        if (!IsAppUrl(e.Source)) return;
        string id = null;
        try
        {
            string payload = e.TryGetWebMessageAsString();
            if (payload == null || payload.Length > 40 * 1024 * 1024) throw new InvalidDataException("The file is too large to save.");
            var request = json.Deserialize<Dictionary<string, object>>(payload);
            object value;
            id = request.TryGetValue("id", out value) ? value as string : null;
            if (String.IsNullOrEmpty(id) || id.Length > 128) return;
            if (!request.TryGetValue("action", out value) || (value as string) != "saveFile") throw new InvalidDataException("Unknown desktop request.");
            string suggestedName = request.TryGetValue("name", out value) ? value as string : null;
            string text = request.TryGetValue("text", out value) ? value as string : null;
            if (text == null || text.Length > 16 * 1024 * 1024) throw new InvalidDataException("The file is too large to save.");
            suggestedName = Path.GetFileName(suggestedName ?? "BroLoot.utl");
            foreach (char invalid in Path.GetInvalidFileNameChars()) suggestedName = suggestedName.Replace(invalid, '_');
            bool isJson = suggestedName.EndsWith(".json", StringComparison.OrdinalIgnoreCase);
            if (!isJson && !suggestedName.EndsWith(".utl", StringComparison.OrdinalIgnoreCase)) suggestedName += ".utl";
            using (var dialog = new SaveFileDialog())
            {
                dialog.Title = "Save " + suggestedName;
                dialog.FileName = suggestedName;
                dialog.Filter = isJson ? "BroLoot settings (*.json)|*.json" : "Virindi Tank loot profile (*.utl)|*.utl";
                dialog.DefaultExt = isJson ? "json" : "utl";
                dialog.AddExtension = true;
                dialog.OverwritePrompt = true;
                dialog.InitialDirectory = Directory.Exists(lastDirectory) ? lastDirectory : Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
                if (dialog.ShowDialog(this) != DialogResult.OK) { Reply(id, "cancelled", null, null); return; }
                // Write to a temporary sibling, then replace atomically so a failed save
                // cannot leave a truncated profile or destroy an existing one.
                string temporary = Path.Combine(Path.GetDirectoryName(dialog.FileName), ".broloot-" + Guid.NewGuid().ToString("N") + ".tmp");
                try
                {
                    File.WriteAllText(temporary, text, new UTF8Encoding(false));
                    if (File.Exists(dialog.FileName)) File.Replace(temporary, dialog.FileName, null);
                    else File.Move(temporary, dialog.FileName);
                }
                finally { if (File.Exists(temporary)) File.Delete(temporary); }
                lastDirectory = Path.GetDirectoryName(dialog.FileName);
                try { File.WriteAllText(Path.Combine(dataDirectory, "last-save-folder.txt"), lastDirectory); } catch { }
                Reply(id, "saved", Path.GetFileName(dialog.FileName), dialog.FileName);
            }
        }
        catch (Exception ex) { if (id != null) Reply(id, "error", null, ex.Message); }
    }

    private void Reply(string id, string status, string name, string detail)
    {
        browser.CoreWebView2.PostWebMessageAsJson(json.Serialize(new { id, status, name, detail }));
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing) browser.Dispose();
        base.Dispose(disposing);
    }
}
