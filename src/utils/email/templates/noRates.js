module.exports.noRatesTemplate = (customerName) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quotation Not Found</title>     
    </head>
    <body>
    <style>
    .container{
        margin-left: 30px;
    }
    
    *{
        font-family: 'Roboto Condensed', sans-serif;
    }
    </style>
        <div class="container">
            <div class="header">
                <h2>Hi ${customerName},</h2>
            </div>
            <div>
                <h3>We're sorry!</h3>
            </div>
            <div class="paragraph-txt">
                <p>
                    Based on your search criteria , we don't have any available schedules to offer you at
                    this time. This is mainly caused by the current high demand of space on our vessels
                    and lack of equipment availability in the market.
                </p>
                </br>
                <p>
                    We sincerely apologise for any inconvenience this may cause you . We hope you
                    understand why we can't offer you a slot on your preferred trade and look forward to
                    working with you again as soon as we can.
                </p>
            </div>
        </div>    
    </body>
    </html>`
}