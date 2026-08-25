import os

filepath = r"c:\Users\lbeneforti\OneDrive - Satiz TPM\Desktop\Project\VDL Manager\static\js\app.js"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# We want to find the second occurrence of "// VDL Manager Pro - SPA Application Engine"
# and slice the file from there to the end.
header = "// VDL Manager Pro - SPA Application Engine"
first_idx = content.find(header)
if first_idx != -1:
    second_idx = content.find(header, first_idx + len(header))
    if second_idx != -1:
        new_content = content[second_idx:]
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Successfully cleaned up app.js starting from index:", second_idx)
    else:
        print("Second header not found.")
else:
    print("Header not found.")
