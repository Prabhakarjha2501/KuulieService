module.exports.contractRatesAvailable = (result) => {
    const generateTableRows = () => {
        let rows = '';
        for (let i = 0; i < result.length; i += 8) {
            const rowSlice = result.slice(i, i + 8);
            const columns = rowSlice.map(contractRate => `<td>${contractRate}</td>`).join('');
            rows += `<tr>${columns}</tr>`;
        }
        return rows;
    };

    return `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            .container {
                margin: 30px;
                font-family: 'Roboto Condensed', sans-serif;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }

            th, td {
                border: 1px solid #dddddd;
                text-align: left;
                padding: 8px;
            }

            th {
                background-color: #f2f2f2;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Dear Luina Team,</h2>
            </div>
            <div class="paragraph-txt">
                <p>
                    Below Contract rates are available now in the system and ready to use.
                </p>
                <table>
                    <thead>
                        <tr>
                        <th colspan="8">Contract Number</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateTableRows()}
                    </tbody>
                </table>
                <br>
                <br>
                <h4>Thanks,</h4>
                <h4>Kuulie System</h4>
            </div>
        </div>    
    </body>
    </html>`;
}
