from pathlib import Path
p = Path('test_material_error.txt')
print(p.read_text(errors='replace')[:2000])
