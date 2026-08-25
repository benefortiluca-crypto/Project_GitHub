import sys
import os
import datetime

# Add parent directory to sys.path to import calculate_delay_for_row
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import calculate_delay_for_row

def run_tests():
    print("Testing calculate_delay_for_row logic...")
    today = datetime.date.today()
    
    # Test case 1: Next issue forecast date in the past but under threshold (5 days past, threshold 15)
    past_forecast = (today - datetime.timedelta(days=5)).strftime("%Y-%m-%d")
    row1 = {
        "Next issue forecast date": past_forecast,
        "Promise date": "2026-01-01"
    }
    res1 = calculate_delay_for_row(row1, 15)
    print(f"Test 1: Next forecast 5 days past -> is_overdue={res1['is_overdue']}, delay_days={res1['delay_days']}")
    assert res1['is_overdue'] == False
    assert res1['delay_days'] == 0
    
    # Test case 1b: Next issue forecast date in the past and over threshold (20 days past, threshold 15)
    past_forecast_over = (today - datetime.timedelta(days=20)).strftime("%Y-%m-%d")
    row1b = {
        "Next issue forecast date": past_forecast_over,
        "Promise date": "2026-01-01"
    }
    res1b = calculate_delay_for_row(row1b, 15)
    print(f"Test 1b: Next forecast 20 days past -> is_overdue={res1b['is_overdue']}, delay_days={res1b['delay_days']}")
    assert res1b['is_overdue'] == True
    assert res1b['delay_days'] == 20

    # Test case 2: Next issue forecast date is present and in the future
    future_forecast = (today + datetime.timedelta(days=5)).strftime("%Y-%m-%d")
    row2 = {
        "Next issue forecast date": future_forecast,
        "Promise date": "2026-01-01"
    }
    res2 = calculate_delay_for_row(row2, 15)
    print(f"Test 2: Next forecast in the future -> is_overdue={res2['is_overdue']}, delay_days={res2['delay_days']}")
    assert res2['is_overdue'] == False
    assert res2['delay_days'] == 0
    
    # Test case 3: Next issue forecast date is empty, Promise date under threshold (10 days past, threshold 15)
    past_promise = (today - datetime.timedelta(days=10)).strftime("%Y-%m-%d")
    row3 = {
        "Next issue forecast date": "",
        "Promise date": past_promise
    }
    res3 = calculate_delay_for_row(row3, 15)
    print(f"Test 3: Promise 10 days past -> is_overdue={res3['is_overdue']}, delay_days={res3['delay_days']}")
    assert res3['is_overdue'] == False
    assert res3['delay_days'] == 0

    # Test case 3b: Next issue forecast date is empty, Promise date over threshold (25 days past, threshold 15)
    past_promise_over = (today - datetime.timedelta(days=25)).strftime("%Y-%m-%d")
    row3b = {
        "Next issue forecast date": "",
        "Promise date": past_promise_over
    }
    res3b = calculate_delay_for_row(row3b, 15)
    print(f"Test 3b: Promise 25 days past -> is_overdue={res3b['is_overdue']}, delay_days={res3b['delay_days']}")
    assert res3b['is_overdue'] == True
    assert res3b['delay_days'] == 25
    
    # Test case 4: Next issue forecast date is empty, Promise date is in the future
    future_promise = (today + datetime.timedelta(days=10)).strftime("%Y-%m-%d")
    row4 = {
        "Next issue forecast date": "",
        "Promise date": future_promise
    }
    res4 = calculate_delay_for_row(row4, 15)
    print(f"Test 4: Next forecast empty, Promise in the future -> is_overdue={res4['is_overdue']}, delay_days={res4['delay_days']}")
    assert res4['is_overdue'] == False
    assert res4['delay_days'] == 0
    
    # Test case 5: Both empty
    row5 = {
        "Next issue forecast date": "",
        "Promise date": ""
    }
    res5 = calculate_delay_for_row(row5, 15)
    print(f"Test 5: Both empty -> is_overdue={res5['is_overdue']}, delay_days={res5['delay_days']}")
    assert res5['is_overdue'] == False
    assert res5['delay_days'] == 0
    
    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
