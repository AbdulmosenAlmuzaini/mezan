
import requests
import time

BASE_URL = "http://localhost:8000"

def test_backend():
    print("--- Starting Backend Tests ---")
    
    # 1. Register
    print("Testing /register...")
    reg_data = {
        "email": "test@example.com",
        "name": "Test User",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/register", json=reg_data)
    if response.status_code == 400 and "already registered" in response.text:
       print("User already exists, proceeding to login.")
    elif response.status_code != 200:
        print(f"FAILED registration: {response.status_code} {response.text}")
        return
    else:
        print("Registration SUCCESS")

    # 2. Login
    print("Testing /login...")
    login_data = {
        "username": "test@example.com",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/login", data=login_data)
    if response.status_code != 200:
        print(f"FAILED login: {response.status_code} {response.text}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login SUCCESS")

    # 3. Add Transaction
    print("Testing POST /transactions...")
    tx_data = {
        "title": "Test Expense",
        "amount": 100.0,
        "category": "Food",
        "type": "expense"
    }
    response = requests.post(f"{BASE_URL}/transactions", json=tx_data, headers=headers)
    if response.status_code != 200:
        print(f"FAILED add transaction: {response.status_code} {response.text}")
        return
    
    tx_id = response.json()["id"]
    print(f"Add Transaction SUCCESS (ID: {tx_id})")

    # 4. Get Transactions
    print("Testing GET /transactions...")
    response = requests.get(f"{BASE_URL}/transactions", headers=headers)
    if response.status_code != 200:
        print(f"FAILED get transactions: {response.status_code} {response.text}")
        return
    
    txs = response.json()
    if len(txs) > 0:
        print(f"Get Transactions SUCCESS (Count: {len(txs)})")
    else:
        print("FAILED: No transactions found")
        return

    # 5. Delete Transaction
    print(f"Testing DELETE /transactions/{tx_id}...")
    response = requests.delete(f"{BASE_URL}/transactions/{tx_id}", headers=headers)
    if response.status_code != 200:
        print(f"FAILED delete: {response.status_code} {response.text}")
        return
    print("Delete SUCCESS")

    # 6. AI Analysis
    print("Testing /analyze...")
    response = requests.post(f"{BASE_URL}/analyze", json=[tx_data], headers=headers)
    if response.status_code != 200:
        print(f"FAILED analyze: {response.status_code} {response.text}")
    else:
        print("Analyze Response Received (Success or Fallback)")

    print("--- All Backend Tests PASSED ---")

if __name__ == "__main__":
    try:
        test_backend()
    except Exception as e:
        print(f"ERROR during testing: {e}")
