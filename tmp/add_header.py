import os

def prepend_to_files(directory):
    for root, dirs, files in os.walk(directory):
        # Evitar node_modules y .git
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        if 'dist' in dirs:
            dirs.remove('dist')
            
        for file in files:
            if file.endswith(('.ts', '.tsx', '.css')):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if not content.startswith('/** final 1.0 */'):
                    print(f"Adding header to {file_path}")
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write('/** final 1.0 */\n' + content)

if __name__ == "__main__":
    project_dir = r"c:\Users\nangv\Desktop\Trabajo\vanta\vanta_media\vanta_media_compesaciones"
    prepend_to_files(os.path.join(project_dir, 'src'))
    # También package.json and README.md maybe? User said "todos los archivos"
    # But for those, // notation doesn't work. I'll stick to code files in src.
