module.exports.contractRatesExpires = (result,validate) => {
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
                <h2>Dear Luina Team,</h2>
            </div>
            <div class="paragraph-txt">
                <p>
                Your contract no <b>${result.contract_number}</b>
                 will be getting expired on <b>${validate}</b> of carrier <b>${result.carrier}.</b>
                </p>
                <p>Kindly update the rates immediately.</p>
                </br>
                </br>
                <h4>Thanks,</h4>
                <h4>Kuulie System</h4>
            </div>
        </div>    
    </body>
    </html>`
}