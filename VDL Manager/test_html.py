from main import generate_html_email

docs = [{
    'document_code': 'DOC-01',
    'document_title': 'Test Doc',
    'last_filled_column': 'I Issue',
    'last_filled_date': '2024-01-01',
    'next_issue_forecast_date': '2024-01-15',
    'delay_days': 10
}]

try:
    print("Testing IT...")
    html_it = generate_html_email("PROVA 1", docs, 15, "Note", "it")
    print("Testing EN...")
    html_en = generate_html_email("PROVA 1", docs, 15, "Note", "en")
    print("Success!")
except Exception as e:
    import traceback
    traceback.print_exc()
