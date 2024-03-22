module.exports.quotePendingRequestTemplate = (result, customerName, myQuotation) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quotation Confirmed</title>     
    <style>

    * {
        font-family: 'Roboto Condensed', sans-serif;
    }

    .container{
        margin-left: 30px;
    }
    
    .header{
        font-size:10px;
    }

    .client-logo {
        height: 80px;
      }

      hr.solid {
        border-top: 3px solid #bbb;
        margin-top: 25px;
      }

      .footer {
        margin-top: 15px;
      }

      .kuulie-logo {
        height: 20px;
      }

    </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
            <img class="client-logo" alt="Client Logo" src="cid:client-logo" />
            </div>
            <div>
                <p> Hi ,</p>
            </div>
            <div class="paragraph-txt">
                <p>
                Customer ${customerName} has sent
                quotation ${myQuotation} for your approval. <br />
                <h4>Thanks</h4>
                </p>
            </div>
            <hr class="solid">
            <div class="footer">
              <img class="kuulie-logo" alt="Kuulie" src="cid:kuulie-logo" />
            </div>
        </div>    
    </body>
    </html>`

}