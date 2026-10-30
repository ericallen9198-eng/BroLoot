from pathlib import Path
import subprocess,tempfile,zipfile
root=Path(__file__).resolve().parent
with tempfile.TemporaryDirectory(prefix='broloot-tests-') as directory:
    with zipfile.ZipFile(root/'fixtures/DreamWeave-profiles.zip') as archive: archive.extractall(directory)
    for name in ['check_noobloot.cjs','check_utl.cjs','check_desktop.cjs','check_ratings.cjs','check_cloaks.cjs','check_rules.cjs']:
        subprocess.run(['node',str(root/name)],cwd=directory,check=True)
