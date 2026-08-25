import sys
import os
import datetime

# Add the project folder to python path to import main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import main

# Helper to format dates
def days_ago(n):
    return (datetime.date.today() - datetime.timedelta(days=n)).strftime("%Y-%m-%d")

def days_future(n):
    return (datetime.date.today() + datetime.timedelta(days=n)).strftime("%Y-%m-%d")

print("Starting unit tests for VDL overdue calculation logic (with delay tolerance filter)...\n")

# TEST 1: First submission not done, Promise Date was 5 days ago. Buffer is 15 days.
# Expected: is_overdue = False (because 5 days delay <= 15 days buffer)
row_1 = {
    "Promise date": days_ago(5),
    "1° Invio previsione": days_ago(10),
    "Next issue forecast date": days_ago(5),
    "Actual Date": ""
}
res_1 = main.calculate_delay_for_row(row_1, 15)
print("TEST 1 (First submission 5 days late, buffer 15):", res_1)
assert res_1["is_overdue"] is False, "Test 1 failed: should not be overdue yet"
assert res_1["delay_days"] == 5, f"Test 1 failed: delay should be 5, got {res_1['delay_days']}"

# TEST 2: First submission done
# Expected: is_overdue = False
row_2 = {
    "Promise date": days_ago(5),
    "1° Invio previsione": days_ago(10),
    "Next issue forecast date": days_ago(5),
    "Actual Date": days_ago(6)
}
res_2 = main.calculate_delay_for_row(row_2, 15)
print("TEST 2 (First submission already done):", res_2)
assert res_2["is_overdue"] is False, "Test 2 failed: should not be overdue"

# TEST 3: Revision 1 overdue by 4 days, buffer is 15 days.
# Expected: is_overdue = False (because 4 days delay <= 15 days buffer)
row_3 = {
    "Return Date": days_ago(19), 
    "Next issue forecast date": days_ago(4),
    "Actual Date": days_ago(20), 
    "Actual Date1": "" 
}
res_3 = main.calculate_delay_for_row(row_3, 15)
print("TEST 3 (Revision 1, 4 days late, buffer 15):", res_3)
assert res_3["is_overdue"] is False, "Test 3 failed: should not be overdue yet"

# TEST 4: Revision 1 overdue by 20 days, buffer is 15 days.
# Expected: is_overdue = True, delay_days = 20 (because 20 days delay > 15 days buffer)
row_4 = {
    "Return Date": days_ago(35), 
    "Next issue forecast date": days_ago(20),
    "Actual Date": days_ago(36), 
    "Actual Date1": "" 
}
res_4 = main.calculate_delay_for_row(row_4, 15)
print("TEST 4 (Revision 1, 20 days late, buffer 15):", res_4)
assert res_4["is_overdue"] is True, "Test 4 failed: should be overdue"
assert res_4["delay_days"] == 20, f"Test 4 failed: delay should be 20, got {res_4['delay_days']}"

# TEST 5: Revision 1 not yet overdue (forecast is in future)
# Expected: is_overdue = False
row_5 = {
    "Return Date": days_ago(10), 
    "Next issue forecast date": days_future(5),
    "Actual Date": days_ago(12),
    "Actual Date1": ""
}
res_5 = main.calculate_delay_for_row(row_5, 15)
print("TEST 5 (Revision 1 not yet overdue):", res_5)
assert res_5["is_overdue"] is False, "Test 5 failed: should not be overdue"

print("\nAll unit tests passed successfully!")
