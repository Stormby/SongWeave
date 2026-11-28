"""Exercise the embedded editor layout in a browser on the Mac build runner."""
from pathlib import Path
from tempfile import TemporaryDirectory
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1] / 'web'
page_text = (root / 'template.html').read_text()
for marker, source in [('ENGINE', 'engine.js'), ('APP', 'app.js')]:
    page_text = page_text.replace(f'/*{marker}*/', (root / source).read_text())

with TemporaryDirectory() as temp, sync_playwright() as pw:
    page_path = Path(temp) / 'frames.html'
    page_path.write_text(page_text)
    browser = pw.chromium.launch(channel='chrome')
    page = browser.new_page(viewport={'width': 985, 'height': 717})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(page_path.as_uri())
    page.select_option('#theme', 'Troels Hammer')
    page.select_option('#minutes', '60')
    page.select_option('#mode', '2')
    assert 'No notes' in page.locator('.row').first.inner_text()
    page.select_option('#view', '0')
    page.select_option('#zoom', '4')
    page.click('#forward')
    assert '5–8' in page.inner_text('#rollinfo')
    page.select_option('#view', '-1')
    for width in (760, 985, 1400):
        page.set_viewport_size({'width': width, 'height': 717})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert not errors, errors
    browser.close()
