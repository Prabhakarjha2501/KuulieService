# kuulie_services

# Install dependencies

npm install

# Run services locally

npm run dev

# Run services in production

npm start

# Execute the services in Postman or any client application.

1. POST http://localhost:5000/user/v1/sendEmail

**Request**
Authorization Bearer [jwt_token]
Body :
{
emailAddress:'destination@gmail.com,
name : Name of applicant
}

**Repsonse**
{ success: 'Email successfully sent', status: 200 }