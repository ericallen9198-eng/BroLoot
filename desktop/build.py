"""Build the portable Windows x64 package using a .NET SDK and NuGet references.
Usage: python desktop/build.py --sdk /path/to/dotnet/sdk/VERSION --deps /path/to/deps --output /path/to/staging
"""
from pathlib import Path
import argparse,shutil,subprocess,os,json,zipfile
parser=argparse.ArgumentParser();parser.add_argument('--sdk',required=True);parser.add_argument('--deps',required=True);parser.add_argument('--output',required=True);args=parser.parse_args()
project=Path(__file__).resolve().parent.parent;sdk=Path(args.sdk).resolve();deps=Path(args.deps).resolve();staging=Path(args.output).resolve();out=staging/'BroLoot';out.mkdir(parents=True,exist_ok=True)
ref=deps/'microsoft.netframework.referenceassemblies.net48/build/.NETFramework/v4.8';wv=deps/'microsoft.web.webview2';refs=[p for p in ref.glob('*.dll') if p.name not in ['System.EnterpriseServices.Thunk.dll','System.EnterpriseServices.Wrapper.dll']]+list((ref/'Facades').glob('*.dll'))+list((wv/'lib/net462').glob('Microsoft.Web.WebView2.Core.dll'))+list((wv/'lib/net462').glob('Microsoft.Web.WebView2.WinForms.dll'))
# The tiny native host only needs Windows' installed .NET Framework, not the build SDK.
response=['/nologo','/target:winexe','/platform:x64','/optimize+','/deterministic+','/nostdlib+','/out:'+str(out/'BroLoot.exe'),'/win32manifest:'+str(project/'desktop/app.manifest')]
icon=project/'desktop/BroLoot.ico'
if icon.exists():response.append('/win32icon:'+str(icon))
response += ['/reference:'+str(p) for p in refs]+[str(project/'desktop/BroLoot.cs')]
rsp=staging/'compiler.rsp';rsp.write_text('\n'.join('"'+v+'"' for v in response))
dotnet=sdk.parent.parent/'dotnet';env=os.environ.copy();env['DOTNET_CLI_HOME']=str(staging/'dotnet-cache');env['DOTNET_CLI_TELEMETRY_OPTOUT']='1';subprocess.run([str(dotnet),str(sdk/'Roslyn/bincore/csc.dll'),'@'+str(rsp)],check=True,env=env)
for name in ['Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll']:shutil.copy2(wv/'lib/net462'/name,out/name)
shutil.copy2(wv/'runtimes/win-x64/native/WebView2Loader.dll',out/'WebView2Loader.dll')
shutil.copy2(project/'desktop/BroLoot.exe.config',out/'BroLoot.exe.config')
shutil.copy2(wv/'LICENSE.txt',out/'WebView2-LICENSE.txt')
if (out/'wwwroot').exists():shutil.rmtree(out/'wwwroot')
shutil.copytree(project/'dist',out/'wwwroot',ignore=shutil.ignore_patterns('downloads'))
(out/'README.txt').write_text('''BroLoot for Windows\n\n1. Extract the entire ZIP into any folder on your PC.\n2. Open the extracted BroLoot folder and double-click BroLoot.exe.\n3. Use Open profile to load an existing UTL, or edit your targets and choose Export UTL.\n4. The Windows Save As dialog lets you choose exactly where to save the profile.\n\nNO LOGIN OR ONLINE GATE\nNo ChatGPT account, Microsoft account, subscription, license key, or website is required.\nThe editor runs locally and works offline once its Windows runtime dependencies are present.\nSettings stay on the PC. Exports include editor settings so you can reopen them later.\n\nREQUIREMENTS\nWindows 10 or 11, 64-bit x64. Requires .NET Framework 4.8 and the Microsoft Edge WebView2 Runtime.\nThese are present on many current Windows PCs. If WebView2 is missing, BroLoot offers the official free Microsoft installer; no account is needed.\nOfficial WebView2 installer: https://go.microsoft.com/fwlink/p/?LinkId=2124703\n.NET Framework 4.8: https://dotnet.microsoft.com/download/dotnet-framework/net48\n\nSHARING\nSend this entire ZIP to your allegiance mates. Do not send BroLoot.exe by itself: keep its DLLs and wwwroot folder alongside it.\nThe downloaded ZIP does not contain anyone's profiles, saved settings, account details, or credentials.\n\nBUILD NOTES\nVersion 1.1.0. This executable is unsigned and has been cross-compiled, not launched on a Windows machine in this build environment.\nThe user has confirmed that BroLoot-generated UTL profiles work in-game. That confirmation predates the desktop wrapper.\n''',encoding='utf-8')
(out/'Install WebView2 (only if missing).url').write_text('[InternetShortcut]\nURL=https://go.microsoft.com/fwlink/p/?LinkId=2124703\n')
archive=staging/'BroLoot-Windows-x64.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted(out.rglob('*')):
  if p.is_file():z.write(p,p.relative_to(staging))
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'exe':str(out/'BroLoot.exe')}))
