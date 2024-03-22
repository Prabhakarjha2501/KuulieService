module.exports.noRatesAdminTemplate = (result) => {
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
                <h2>Hi</h2>
            </div>
            <div>
                <h3>We're sorry!</h3>
            </div>
            <div class="paragraph-txt">
                <p>
                we couldn't found any rates for “${result.portOfLoadingVal}“ and “${result. portOfDischargeVal}“  on date ${result.cargoReadyDate}“ for “ weight_20 = ${result.weight_20} or weight_40 = ${result.weight_40} or weight_hc = ${result.weight_hc} “ . 
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