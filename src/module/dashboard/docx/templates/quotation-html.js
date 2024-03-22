const cssStyles = `
    html {
        -webkit-print-color-adjust: exact;
        zoom: 0.68;
    }
    @page 
    { 
        size: A4 portrait;
    }
    .heading-color {
        color: #f96349;
    }
    table {
        border-collapse: collapse;
    }
    tbody {
        vertical-align: baseline;
    }
    th, td {
        padding: 10px;
        text-align: left;
    }
    tr td:first-child {
        padding-left: 0px;
    }
`;

const getKeyValueTableSection = sectionData => {
    const { label, data } = sectionData;
    const chunkSize = 4;
    let tableRows = '';
    for (let i = 0; i < data.length; i += chunkSize) {
        const endIndex = i + chunkSize > data.length ? data.length : i + chunkSize;
        const chunkedData = data.slice(i, endIndex);
        const tableCols = chunkedData.map(row => {
            const { label, value } = row;
            return `
            <td style="line-height: 20px;">
            ${label}<br />
            <b>${value}</b>
        </td>
        `;
        }).join('');

        tableRows = `
        ${tableRows}
        <tr>
        ${tableCols}
        </tr>
        `;
    }
    const sectionHTML = `<div>
        <h3 class="heading-color">${label}</h3>
        <table>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    </div>`;
    return sectionHTML;
}

const getCellStyle = index => {
    let style = '';
    if (index === 0) {
        style = 'width: 35%; padding: 10px;';
    } else if (index === 1) {
        style = 'width: 20%;text-align: center; padding: 10px;';
    } else if (index === 2) {
        style = 'width: 20%;text-align: center; padding: 10px;';
    } else if (index === 3) {
        style = 'text-align: center; padding: 10px;';
    }
    return style;
}

const getBucketsSection = sectionData => {
    const { label, data } = sectionData;

    const bucketsHTML = data.map(bucketData => {
        const { headers, data } = bucketData;

        const tableHeaders = headers.map(headerRowData => {
            const headerHTML = headerRowData.map((header, index) => {
                const style = getCellStyle(index);
                return `
                <th style="${style}">
                    ${header}
                </th>
                `;
            }).join('');
            return `
            <tr>
                ${headerHTML}
            </tr>
            `;
        }).join('');

        const tableData = data.map(dataRow => {
            const dataRowHTML = dataRow.map((data, index) => {
                const style = getCellStyle(index)
                return `
                <td style="${style}">
                    ${data}
                </td>
                `;
            }).join('');
            return `
            <tr>
                ${dataRowHTML}
            </tr>
            `;
        }).join('');

        return `
        <table style="background-color: #eff5fa; width: 100%; margin-bottom: 15px;">
            <thead>
                ${tableHeaders}
            </thead>
            <tbody>
                ${tableData}
            </tbody>
        </table>
        `;
    }).join('');

    const sectionHTML = `<div>
            <h3 class="heading-color">${label}</h3>
        ${bucketsHTML}
    </div > `;
    return sectionHTML;
}

const getTotalAmountSection = sectionData => {
    return `
    <div style="text-align: right">
        <h3>${sectionData.label} : ${sectionData.value}</h3>
    </div>
    `;
}

const getIntroTable = (data, float) => {
    return `
    <table style="float: ${float};">
        <tbody>
            ${data.map(item => {
        return `
                        <tr>
                            <td style="padding: 5px 0px;">${item.label}</td>
                            <td style="padding: 5px 0px;">&nbsp;:&nbsp;${item.value}</td>
                        </tr>
                    `
    }).join(' ')
        }
        </tbody>
    </table>
    `;
}

const getIntroSection = intro => {
    const { left, right } = intro;
    const leftHTML = getIntroTable(left, 'left');
    const rightHTML = getIntroTable(right, 'right');
    return `
    <table style="width: 100%;">
        <tbody>
            <tr>
                <td style="width: 50%;vertical-align: top;">
                    ${leftHTML}
                </td>
                <td style="width: 50%;vertical-align: top;">
                    ${rightHTML}
                </td>
            </tr>
        </tbody>
    </table>
    `;
}

const horizontalLine = `<hr style="border-top: 1px solid #DDDDDD; margin-top: 15px; margin-bottom: 15px;" />`;

const getQuotationHTML = async ({
    sections = [],
    intro,
}) => {
    return `<!DOCTYPE html>
    <html lang="en">
        <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
                <style>
                ${cssStyles}             
                </style>

                <body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px;">
                    ${getIntroSection(intro)
        }
                ${horizontalLine}
                    ${sections.map(sectionData => {
            if (sectionData.type === 'KEY_VALUE_TABLE_SECTION') {
                return getKeyValueTableSection(sectionData);
            } else if (sectionData.type === 'BUCKETS_SECTION') {
                return getBucketsSection(sectionData);
            } else if (sectionData.type === 'TOTAL_AMOUNT_SECTION') {
                return getTotalAmountSection(sectionData);
            }
        }).join(horizontalLine)
        }
        </body>
        </html>`;
}

module.exports = {
    getQuotationHTML
}