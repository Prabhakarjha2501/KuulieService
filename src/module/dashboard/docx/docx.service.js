const docx = require("docx");
const fs = require("fs");
const { Document, Packer, Paragraph, TextRun } = docx;

const textDefaults = {
    font: "Arial",
    size: 18,
}

const renderLabel = (label, textProperties = {}) => {
    return new Paragraph({
        children: [
            new TextRun({
                ...textDefaults,
                ...textProperties,
                text: label,
            }),
        ],
    });
}

const renderValue = (label, textProperties = {}) => {
    return new Paragraph({
        alignment: textProperties.alignment || docx.AlignmentType.LEFT,
        children: [
            new TextRun({
                ...textDefaults,
                ...textProperties,
                text: label?.toString() || "",
            }),
        ],
    });
}

const getIntroTable = (tableData, align) => {
    const rows = tableData.map((item) => {
        return new docx.TableRow({
            children: [
                new docx.TableCell({
                    margins: {
                        top: 0,
                        bottom: 75,
                        left: 0,
                        right: 0,
                    },
                    children: [
                        renderLabel(item.label + "\t"),
                    ],
                }),
                new docx.TableCell({
                    margins: {
                        top: 0,
                        bottom: 75,
                        left: 0,
                        right: 0,
                    },
                    children: [
                        renderValue(": " + item.value),
                    ],
                }),
            ],
        });
    });
    return new docx.Table({
        borders: 0,
        alignment: align === "right" ? docx.AlignmentType.RIGHT : docx.AlignmentType.LEFT,
        rows,
    });
}

const getIntroduction = (intro) => {
    return new docx.Table({
        borders: 0,
        width: {
            size: 100,
            type: docx.WidthType.PERCENTAGE,
        },
        alignment: docx.AlignmentType.CENTER,
        rows: [
            new docx.TableRow({
                children: [
                    new docx.TableCell({
                        width: {
                            size: 50,
                            type: docx.WidthType.PERCENTAGE,
                        },
                        children: [
                            getIntroTable(intro.left, "left"),
                        ],
                    }),
                    new docx.TableCell({
                        width: {
                            size: 50,
                            type: docx.WidthType.PERCENTAGE,
                        },
                        children: [
                            getIntroTable(intro.right, "right"),
                        ],
                    }),
                ],
            }),
        ],
    });
}

const getKeyValueTableSectionTableCell = (item) => {
    return new docx.TableCell({
        margins: {
            top: 100,
            bottom: 100,
            left: 100,
            right: 100,
        },
        children: [
            renderLabel(item.label),
            renderValue(item.value, { bold: true }),
        ],
    })
}

const getKeyValueTableSectionTable = (tableData) => {
    let rows = [];
    let i = 0;
    let row = [];
    while (i < tableData.length) {
        const item = tableData[i];
        row.push(getKeyValueTableSectionTableCell(item));
        if (row.length === 4) {
            rows.push(new docx.TableRow({
                children: row,
            }));
            row = [];
        }
        i++;
    }
    rows.push(new docx.TableRow({
        children: row,
    }));
    return new docx.Table({
        borders: 0,
        alignment: docx.AlignmentType.LEFT,
        rows,
    });
}

const getKeyValueTableSection = (sectionData) => {
    let sectionContent = [new docx.Paragraph({
        children: [
            new docx.TextRun({
                ...textDefaults,
                bold: true,
                text: sectionData.label,
                break: 1,
            }),
        ],
    })];
    if (sectionData.data?.length > 0) {
        sectionContent.push(getKeyValueTableSectionTable(sectionData.data));
    }
    sectionContent.push(new docx.Paragraph({
        children: [],
    }));
    return sectionContent;
}


const getBucketsSectionTableCell = (value, textProperties = {}) => {
    return new docx.TableCell({
        margins: {
            top: 100,
            bottom: 100,
            left: 100,
            right: 100,
        },
        columnSpan: textProperties.columnSpan,
        children: [
            renderValue(value, textProperties),
        ],
    })
}


const getBucketsSectionTable = (bucketData) => {
    let rows = [];
    let i = 0;
    while (i < bucketData.headers.length) {
        const headerData = bucketData.headers[i];
        let row = [];
        for (let j = 0; j < headerData.length; j++) {
            const item = headerData[j];
            if (item?.toLowerCase() === "tariff") {
                row.push(getBucketsSectionTableCell(item, { bold: true, columnSpan: bucketData.headers[1]?.length - bucketData.headers[0]?.length + 1, alignment: docx.AlignmentType.CENTER }))
            } else {
                row.push(getBucketsSectionTableCell(item, { bold: true }))
            }
        }
        rows.push(new docx.TableRow({
            children: row,
        }));
        i++;
    }
    i = 0;
    while (i < bucketData.data.length) {
        const headerData = bucketData.data[i];
        let row = [];
        for (let j = 0; j < headerData.length; j++) {
            const item = headerData[j];
            row.push(getBucketsSectionTableCell(item))
        }
        rows.push(new docx.TableRow({
            children: row,
        }));
        i++;
    }
    rows.push(new docx.TableRow({
        children: [new docx.TableCell({
            columnSpan: bucketData.data[0]?.length,
            margins: {
                top: 100,
                bottom: 100,
                left: 100,
                right: 100,
            },
            children: [
                renderValue(""),
            ],
        })],
    }));
    return new docx.Table({
        borders: 1,
        alignment: docx.AlignmentType.LEFT,
        rows,
        width: {
            size: 100,
            type: docx.WidthType.PERCENTAGE,
        },
    });
}

const getBucketsSection = (sectionData) => {
    let sectionContent = [new docx.Paragraph({
        children: [
            new docx.TextRun({
                ...textDefaults,
                bold: true,
                text: sectionData.label,
            }),
        ],
    }), new docx.Paragraph({
        children: [],
    })];
    for (let i = 0; i < sectionData.data.length; i++) {
        const bucketData = sectionData.data[i];
        sectionContent.push(getBucketsSectionTable(bucketData));
    }
    return sectionContent;
}

const generateDocumentModel = async (data) => {
    let pageData = [];
    pageData.push(getIntroduction(data.intro));
    data.sections.forEach((section) => {
        if (section.type === "KEY_VALUE_TABLE_SECTION") {
            const sectionData = getKeyValueTableSection(section);
            pageData.push(...sectionData);
        } else if (section.type === "BUCKETS_SECTION") {
            const sectionData = getBucketsSection(section);
            pageData.push(...sectionData);
        } else if (section.type === "TOTAL_AMOUNT_SECTION") {
            pageData.push(new docx.Paragraph({
                alignment: docx.AlignmentType.RIGHT,
                children: [
                    new docx.TextRun({
                        ...textDefaults,
                        bold: true,
                        text: section.label + "\t: ",
                        break: 2,
                        size: 22,
                    }),
                    new docx.TextRun({
                        ...textDefaults,
                        text: section.value,
                        bold: true,
                        size: 22,
                    }),
                ],
            }));
        }
    });
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: pageData,
            },
        ],
    });
    return doc;
}

const getQuotationDocx = async (fileName, data) => {
    try {
        console.log('******************************* Started => generateQuotationDocx', new Date());
        const doc = await generateDocumentModel(data);
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(fileName, buffer);
        console.log('******************************* Completed => generateQuotationDocx', new Date());
        return buffer;
    } catch (error) {
        console.log(error);
        console.log('******************************* Failed => generateQuotationDocx', new Date());
    }
}

module.exports.getQuotationDocx = getQuotationDocx;
