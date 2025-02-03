# Creating an Admin Account

To create an admin account for the freelance platform, follow these steps:

1. Ensure that the server is running and the .env file is properly configured with the ADMIN_CREATION_KEY.

2. Use a tool like Postman or curl to send a POST request to the registration endpoint:

   Endpoint: `http://localhost:5000/api/auth/register`

   Headers:
   ```
   Content-Type: application/json
   ```

   Body:
   ```json
   {
     "name": "Admin Name",
     "email": "admin@example.com",
     "password": "StrongPassword123!",
     "role": "admin",
     "adminKey": "your-secret-admin-key"
   }
   ```

   Replace "your-secret-admin-key" with the actual ADMIN_CREATION_KEY from your .env file.

3. If successful, you should receive a response with the created admin user details and a JWT token.

4. You can now use these credentials to log in to the admin dashboard.

Important Notes:
- Keep the ADMIN_CREATION_KEY secure and do not share it publicly.
- It's recommended to change the ADMIN_CREATION_KEY after creating the initial admin account.
- Ensure that the password meets the required criteria (at least 8 characters, including uppercase, lowercase, number, and special character).

For security reasons, it's advisable to disable or restrict the admin registration route in production environments after creating the necessary admin accounts.
