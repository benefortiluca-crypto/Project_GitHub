import re

with open("sig_emtb.html", "r", encoding="utf-8") as f:
    html = f.read()

# Strip tags to see plain text
text = re.sub('<[^<]+?>', '', html)
# Clean up whitespace
text = "\n".join([line.strip() for line in text.splitlines() if line.strip()])

print("--- PLAIN TEXT CONTENT OF GENERATED SIGNATURE ---")
print(text[:2000])
print("-------------------------------------------------")
