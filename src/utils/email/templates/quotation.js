module.exports.getQuotationTemplate = (link, receiverName, title, message) => {
    return `
    <!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      font-family: 'Roboto Condensed', sans-serif;
    }

    .container {
      display: block;
      margin: 30px;
    }

    .header {
      margin-top: 30px;
    }

    .footer {
      margin-top: 15px;
    }

    .container .title {
      margin-top: 20px;
      color: rgb(90, 90, 231);
      font-size: 20px;
      font-weight: 700;
    }

    .msg {
      margin-top: 25px;
      text-align: justify;
    }

    .action-button {
      margin-top: 20px;
      background-color: orangered;
      color: white;
      border-radius: 5px;
      border: none;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      padding: 8px 15px;
      width: 80px;
    }

    .action-button a {
        text-decoration: none;
        color: white;
    }

    hr.solid {
      border-top: 3px solid #bbb;
      margin-top: 25px;
    }

    .client-logo {
      height: 80px;
    }

    .kuulie-logo {
      height: 20px;
      float: right;
    }

    @media (max-width: 800px) {
      .container {
        margin: 15px;
      }

      .container .title {
        margin-top: 25px;
      }

    }

    @media (max-width: 400px) {
      .container {
        margin: 5px;
      }

      .container .title {
        margin-top: 25px;
      }

    }
  </style>
  <title>invite html</title>
</head>

<body>
  <div class="container">
    <div class="header">
      <img class="client-logo" alt="Client Logo" src="cid:client-logo" />
    </div>
    <div class="title">
      <div>${title}</div>
    </div>
    <div class="msg">
      <p class="name">Hi ${receiverName}, </p>
      <p> 
      ${message}
      </p>
    </div>
    ${
      link ?
      `<div class="action-button">
        <a href="${link}">Check it now</a>
      </div>`
      : ''
    }
    <hr class="solid">
    <div class="footer">
      <img class="kuulie-logo" alt="Kuulie" src="cid:kuulie-logo" />
    </div>
  </div>
</body>

</html>
   `
}