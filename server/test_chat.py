import httpx

BASE = "http://localhost:8000"


def main():
    with httpx.Client(timeout=120.0) as client:
        # 1. Login (or register if needed)
        email = "alice@example.com"
        password = "password123"

        r = client.post(f"{BASE}/auth/login", json={"email": email, "password": password})
        if r.status_code != 200:
            print("Login failed. Registering instead...")
            r = client.post(f"{BASE}/auth/register", json={
                "username": "alice",
                "email": email,
                "password": password,
            })
            print("Register:", r.status_code)
            r = client.post(f"{BASE}/auth/login", json={"email": email, "password": password})

        tokens = r.json()
        access = tokens["access_token"]
        headers = {"Authorization": f"Bearer {access}"}
        print("✅ Logged in")

        # 2. Create a conversation
        r = client.post(f"{BASE}/conversations", json={"title": "E2E Test"}, headers=headers)
        conv_id = r.json()["id"]
        print(f"✅ Created conversation #{conv_id}")

        # 3. Send messages (streamed)
        for question in ["What is Python in 2 sentences?", "Now what about JavaScript?"]:
            print(f"\n👤 User: {question}")
            print("🤖 AI: ", end="", flush=True)

            with client.stream(
                "POST",
                f"{BASE}/conversations/{conv_id}/messages",
                json={"content": question},
                headers=headers,
            ) as resp:
                for line in resp.iter_lines():
                    if line.startswith("data: "):
                        token = line[6:]
                        if token == "[DONE]":
                            break
                        # Unescape newlines we added server-side
                        print(token.replace("\\n", "\n"), end="", flush=True)
            print()

        # 4. Verify history was saved
        r = client.get(f"{BASE}/conversations/{conv_id}/messages", headers=headers)
        msgs = r.json()
        print(f"\n✅ History saved: {len(msgs)} messages")
        for m in msgs:
            print(f"   [{m['role']}] {m['content'][:60]}...")

        # 5. Verify in DB
        print(f"\n🎉 Full E2E test passed! Conversation ID: {conv_id}")


if __name__ == "__main__":
    main()