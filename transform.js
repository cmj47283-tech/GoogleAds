const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'public', 'assets');
const EXCEL_EXTENSIONS = new Set(['.xlsx', '.xls']);

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function findRootExcelInputFile() {
    const candidates = fs.readdirSync(__dirname, { withFileTypes: true })
        .filter(entry => {
            if (!entry.isFile()) return false;
            if (entry.name.startsWith('~$') || entry.name.startsWith('.')) return false;
            return EXCEL_EXTENSIONS.has(path.extname(entry.name).toLowerCase());
        })
        .map(entry => {
            const filePath = path.join(__dirname, entry.name);
            const stats = fs.statSync(filePath);
            return {
                name: entry.name,
                filePath,
                mtimeMs: stats.mtimeMs
            };
        })
        .sort((left, right) => {
            if (right.mtimeMs !== left.mtimeMs) {
                return right.mtimeMs - left.mtimeMs;
            }
            return left.name.localeCompare(right.name);
        });

    return candidates.length ? candidates[0].filePath : '';
}

function padDatePart(value) {
    return String(value).padStart(2, '0');
}

function normalizeDateValue(value) {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    if (typeof value === 'number') {
        const parsedCode = XLSX.SSF.parse_date_code(value);
        if (parsedCode) {
            return [
                parsedCode.y,
                padDatePart(parsedCode.m),
                padDatePart(parsedCode.d)
            ].join('-');
        }
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return [
            value.getFullYear(),
            padDatePart(value.getMonth() + 1),
            padDatePart(value.getDate())
        ].join('-');
    }

    const text = String(value).trim();
    const slashMatch = text.match(/^(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})$/);
    if (slashMatch) {
        let first = Number(slashMatch[1]);
        const second = Number(slashMatch[2]);
        let third = Number(slashMatch[3]);
        let year = first;
        let month = second;
        let day = third;

        if (slashMatch[1].length !== 4) {
            year = third;
            month = first;
            day = second;
        }

        if (year < 100) {
            year += 2000;
        }

        return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
    }

    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
        return [
            parsed.getFullYear(),
            padDatePart(parsed.getMonth() + 1),
            padDatePart(parsed.getDate())
        ].join('-');
    }

    return text;
}

function convertByType(value, type, key = '') {
    if (String(key).toLowerCase() === 'date') {
        return normalizeDateValue(value);
    }

    const normalizedType = String(type || 'string').trim().toLowerCase();

    if (value === null || value === undefined || value === '') {
        if (normalizedType === 'int' || normalizedType === 'integer') {
            return 0;
        } else if (normalizedType === 'float' || normalizedType === 'double') {
            return 0.0;
        } else if (normalizedType === 'bool' || normalizedType === 'boolean') {
            return false;
        } else if (normalizedType === 'string' || normalizedType === 'sting') {
            return '';
        }
        return null;
    }

    switch (normalizedType) {
        case 'int':
        case 'integer':
            return parseInt(value, 10);
        case 'float':
        case 'double':
            return parseFloat(value);
        case 'bool':
        case 'boolean':
            const lowerValue = String(value).toLowerCase();
            return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
        case 'sting':
        case 'string':
        default:
            return String(value);
    }
}

function normalizeColumnKey(key) {
    if (key === null || key === undefined) {
        return '';
    }

    const text = String(key).trim();
    if (!text || text.startsWith('//')) {
        return '';
    }

    return text.toLowerCase() === 'date' ? 'date' : text;
}

function isTypeCell(value) {
    const text = String(value || '').trim().toLowerCase();
    return ['string', 'sting', 'int', 'integer', 'float', 'double', 'bool', 'boolean', 'date'].includes(text);
}

function resolveSheetLayout(jsonData) {
    const scanLimit = Math.min(jsonData.length, 8);

    for (let rowIndex = 0; rowIndex < scanLimit; rowIndex++) {
        const row = jsonData[rowIndex] || [];
        const filledCells = row.filter(cell => String(cell || '').trim());
        if (!filledCells.length) continue;

        const typeCellCount = filledCells.filter(isTypeCell).length;
        if (rowIndex >= 1 && typeCellCount / filledCells.length >= 0.7) {
            const keys = jsonData[rowIndex - 1] || [];
            const labels = rowIndex >= 2 ? jsonData[rowIndex - 2] || [] : keys;
            return {
                labels,
                keys,
                types: row,
                dataRows: jsonData.slice(rowIndex + 1)
            };
        }
    }

    return {
        labels: jsonData[1] || jsonData[0] || [],
        keys: jsonData[2] || jsonData[0] || [],
        types: jsonData[3] || [],
        dataRows: jsonData.slice(4)
    };
}

async function processExcelFile(filePath = findRootExcelInputFile()) {
    if (!filePath) {
        console.error(`No Excel input file found in project root: ${__dirname}`);
        return;
    }

    console.log(`Processing file: ${filePath}`);

    try {
        const workbook = XLSX.readFile(filePath, { cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });

        if (jsonData.length < 4) {
            console.error(`File ${filePath} doesn't have enough rows for conversion.`);
            return;
        }

        const { labels, keys, types, dataRows } = resolveSheetLayout(jsonData);

        const columns = [];
        for (let i = 0; i < keys.length; i++) {
            const key = normalizeColumnKey(keys[i]);
            if (key) {
                columns.push({
                    width: 100,
                    key,
                    label: labels[i] || key
                });
            }
        }

        const columnsPath = path.join(OUTPUT_DIR, 'columns.json');
        fs.writeFileSync(columnsPath, JSON.stringify(columns, null, 2), 'utf8');
        console.log(`Successfully created ${columnsPath}`);

        const tableData = [];
        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            const obj = {};

            if (!row || row.every(cell => cell === undefined || cell === null || cell === '')) {
                continue;
            }

            for (let j = 0; j < keys.length; j++) {
                const key = normalizeColumnKey(keys[j]);
                if (key) {
                    const value = row[j];
                    const type = types[j] || 'string';
                    obj[key] = convertByType(value, type, key);
                }
            }

            if (Object.keys(obj).length > 0) {
                tableData.push(obj);
            }
        }

        const completedTableData = fillMissingCampaignRows(tableData, columns);
        const transformedTableData = applyDataTransformation(completedTableData);
        const tableDataPath = path.join(OUTPUT_DIR, 'tableData.json');
        fs.writeFileSync(tableDataPath, JSON.stringify(transformedTableData, null, 2), 'utf8');
        console.log(`Successfully created ${tableDataPath}`);

    } catch (error) {
        console.error(`Error processing file ${filePath}:`, error.message);
    }
}

function cleanText(value, fallback = '') {
    if (value === null || value === undefined) {
        return fallback;
    }

    const text = String(value).trim();
    if (!text) {
        return fallback;
    }

    return text;
}

function readNumber(value) {
    const text = cleanText(value);
    if (!text || text === '--' || text === '—' || text === '。。。') {
        return 0;
    }

    const normalized = text
        .replace(/,/g, '')
        .replace(/\$/g, '')
        .replace(/%/g, '')
        .replace(/\/day/g, '')
        .replace(/[^\d.-]/g, '');

    const number = Number.parseFloat(normalized);
    return Number.isFinite(number) ? number : 0;
}

function normalizeAccount(value, index) {
    const accounts = [
        '921-239-0750',
        '382-941-0056',
        '617-520-8394',
        '105-772-4613',
        '849-316-5582',
        '294-087-1129',
        '503-648-9271',
        '771-403-2285',
        '426-159-6740',
        '938-251-7064'
    ];
    const text = cleanText(value);

    if (!text || text === '--' || text.includes('上面') || text.includes('。。。')) {
        return accounts[index % accounts.length];
    }

    return text;
}

function fillMissingCampaignRows(rows, columns) {
    const hasDateColumn = columns.some(column => column.key === 'date');
    const hasCampaignColumn = columns.some(column => column.key === 'campaign');
    if (!hasDateColumn || !hasCampaignColumn) {
        return rows;
    }

    const uniqueCampaigns = [...new Set(rows
        .map(row => cleanText(row.campaign))
        .filter(campaign => campaign))];
    const uniqueDates = [...new Set(rows
        .map(row => cleanText(row.date))
        .filter(date => date))];

    if (!uniqueCampaigns.length || !uniqueDates.length) {
        return rows;
    }

    const existingKeys = new Set(rows.map(row => `${cleanText(row.date)}||${cleanText(row.campaign)}`));
    const completedRows = [...rows];

    // build a map from campaign name -> campaignId (support multiple possible field names)
    const campaignIdMap = {};
    for (const r of rows) {
        const name = cleanText(r.campaign);
        if (!name) continue;
        const id = cleanText(r.campaignId) || cleanText(r.campaign_id) || cleanText(r['campaign id']) || '';
        if (id) campaignIdMap[name] = id;
    }

    for (const date of uniqueDates) {
        for (const campaign of uniqueCampaigns) {
            const rowKey = `${date}||${campaign}`;
            if (!existingKeys.has(rowKey)) {
                const blankRow = {};
                columns.forEach(column => {
                    if (column.key === 'date') {
                        blankRow.date = date;
                    } else if (column.key === 'campaign') {
                        blankRow.campaign = campaign;
                    } else if (column.key === 'campaign_id') {
                        blankRow.campaign_id = campaignIdMap[campaign] || '';
                    } else if (column.key === 'campaignId') {
                        blankRow.campaignId = campaignIdMap[campaign] || '';
                    } else {
                        blankRow[column.key] = '';
                    }
                });
                completedRows.push(blankRow);
                existingKeys.add(rowKey);
            }
        }
    }

    return completedRows;
}

function getYesterdayDateString() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function randomBetween(min, max) {
    return Math.random() * (max - min) + min + 1;
}

function applyDataTransformation(rows) {
    const yesterdayDate = getYesterdayDateString();
    
    return rows.map(row => {
        const rowDate = cleanText(row.date);
        
        // 只转换昨天之前的数据（rowDate < yesterdayDate）
        // 昨天及以后的数据保持不变
        if (rowDate >= yesterdayDate) {
            return row;
        }
        
        // 昨天之前的数据需要进行转换
        const transformedRow = { ...row };
        
        // cost、impressions、clicks 三个字段各自乘以一个随机数 x (-0.003, 0.003)
        const fieldsToApplyX = ['cost', 'impressions', 'clicks'];
        fieldsToApplyX.forEach(field => {
            if (field in transformedRow && transformedRow[field] !== '' && transformedRow[field] !== null && transformedRow[field] !== undefined) {
                const randomX = randomBetween(-0.0003, 0.0003);
                const numericValue = Number(transformedRow[field]);
                if (Number.isFinite(numericValue)) {
                    transformedRow[field] = numericValue * randomX;
                }
            }
        });
        
        // installs 乘以一个随机数 y (0.003, 0.008)
        if ('installs' in transformedRow && transformedRow.installs !== '' && transformedRow.installs !== null && transformedRow.installs !== undefined) {
            const randomY = randomBetween(0.003, 0.008);
            const numericValue = Number(transformedRow.installs);
            if (Number.isFinite(numericValue)) {
                transformedRow.installs = Math.round(numericValue * randomY);
            }
        }
        
        return transformedRow;
    });
}

function normalizeCampaignStatus(value) {
    const text = cleanText(value, 'Enabled');
    if (text === 'Paused' || text === 'Removed' || text.startsWith('Total:')) {
        return text;
    }
    return 'Enabled';
}

function normalizeStatus(value, campaignStatus) {
    const text = cleanText(value);
    if (text && text !== '。。。') {
        return text;
    }
    return campaignStatus === 'Enabled' ? 'Eligible' : campaignStatus;
}

function objectRowsFromSheet(workbook, sheetName) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
        return [];
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });
    if (rows.length < 4) {
        return [];
    }

    const headers = rows[3];
    return rows.slice(4)
        .filter(row => row && row.some(cell => cleanText(cell)))
        .map((row, rowIndex) => {
            const record = {};
            headers.forEach((header, columnIndex) => {
                if (header) {
                    record[header] = row[columnIndex];
                }
            });
            record.__rowIndex = rowIndex;
            return record;
        });
}

function normalizeCampaignRow(row, index) {
    const campaignStatus = normalizeCampaignStatus(row['Campaign status']);
    const campaignName = cleanText(row.Campaign, `Campaign ${index + 1}`);
    const status = normalizeStatus(row.Status, campaignStatus);
    const installs = readNumber(row.Installs);
    const inAppActions = readNumber(row['In-app actions']);
    const conversions = readNumber(row.Conversions) || installs + inAppActions;
    const cost = readNumber(row.Cost);

    return {
        id: `campaign-${index + 1}`,
        campaignStatus,
        campaign: campaignName,
        budget: cleanText(row.Budget, '$10.00/day'),
        status,
        optimizationScore: cleanText(row['Optimization score'], '--'),
        account: normalizeAccount(row.Account, index),
        campaignType: cleanText(row['Campaign type'], 'App'),
        costPerInstall: readNumber(row['Cost / Install']),
        costPerInAppAction: readNumber(row['Cost / In-app action']),
        viewThroughConv: readNumber(row['View-through conv.']),
        installs,
        inAppActions,
        participatedInAppActions: readNumber(row['Participated in-app actions']) || inAppActions,
        cost,
        costPerParticipatedInAppAction: readNumber(row['Cost / Participated in-app action']),
        convRate: readNumber(row['Conv. rate']),
        conversions,
        costPerConv: readNumber(row['Cost / conv.']),
        isTotal: campaignStatus.startsWith('Total:'),
        isRemoved: campaignStatus === 'Removed'
    };
}

function normalizeAdGroupTemplate(row) {
    return {
        id: 'adgroup-1',
        adGroupStatus: cleanText(row['Ad group status'], 'Enabled'),
        adGroup: cleanText(row['Ad group'], 'Ad group 1'),
        status: cleanText(row.Status, 'Not eligible'),
        targetCpa: cleanText(row['Target CPA'], '$20.00'),
        conversions: readNumber(row.Conversions),
        costPerConv: readNumber(row['Cost / conv.']),
        costPerInstall: readNumber(row['Cost / Install']),
        costPerInAppAction: readNumber(row['Cost / In-app action']),
        viewThroughConv: readNumber(row['View-through conv.']),
        brandInclusions: cleanText(row['Brand Inclusions'], '[]'),
        locationsOfInterest: cleanText(row['Locations of interest'], '[]'),
        installs: readNumber(row.Installs),
        inAppActions: readNumber(row['In-app actions']),
        participatedInAppActions: readNumber(row['Participated in-app actions']),
        cost: readNumber(row.Cost),
        costPerParticipatedInAppAction: readNumber(row['Cost / Participated in-app action']),
        convRate: readNumber(row['Conv. rate'])
    };
}

function buildAssetRows() {
    const imageShares = [0.14, 0.12, 0.1, 0.09, 0.08, 0.07, 0.06, 0.055, 0.045, 0.04];
    const textAssets = [
        { id: 'headline-1', asset: 'Play chess with an AI', assetType: 'Headline', share: 0.09 },
        { id: 'headline-2', asset: 'The best chess game', assetType: 'Headline', share: 0.075 },
        { id: 'headline-3', asset: 'Challenge the AI and become a king of chess', assetType: 'Headline', share: 0.065 },
        { id: 'description-1', asset: 'Improve your chess skills', assetType: 'Description', share: 0.06 },
        { id: 'description-2', asset: 'Become a chess legend', assetType: 'Description', share: 0.05 },
        { id: 'description-3', asset: 'Play chess with computer', assetType: 'Description', share: 0.045 }
    ];

    const imageAssets = imageShares.map((share, index) => {
        const imageNumber = String(index + 1).padStart(2, '0');
        return {
            id: `image-${imageNumber}`,
            asset: `1080 x 1080`,
            assetType: 'Image',
            image: `/assets/ad-assets/asset-${imageNumber}.jpg`,
            source: `Free stock image - 2026-05-09 17:50:13.930 (${index + 1})`,
            dimensions: '1080 x 1080',
            orientation: 'Square',
            aspectRatio: '1:1',
            assetId: String(3590627600 + index),
            share
        };
    });

    return [...imageAssets, ...textAssets].map(asset => ({
        ...asset,
        status: 'Eligible',
        performance: 'Pending',
        clicks: 0,
        ctr: 0,
        impressions: 0,
        cost: 0,
        installs: 0,
        costPerInstall: 0,
        inAppActions: 0,
        costPerInAppAction: 0
    }));
}

async function processGoogleAdsWorkbook(filePath = findRootExcelInputFile()) {
    if (!filePath || !fs.existsSync(filePath)) {
        console.error(`Google Ads input file not found: ${filePath}`);
        return;
    }

    try {
        const workbook = XLSX.readFile(filePath, { cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });

        if (jsonData.length < 4) {
            console.error(`File ${filePath} doesn't have enough rows for conversion.`);
            return;
        }

        const { labels, keys, types, dataRows } = resolveSheetLayout(jsonData);

        const columns = [];
        for (let i = 0; i < keys.length; i++) {
            const key = normalizeColumnKey(keys[i]);
            if (key) {
                columns.push({
                    width: 100,
                    key,
                    label: labels[i] || key
                });
            }
        }

        const columnsPath = path.join(OUTPUT_DIR, 'columns.json');
        fs.writeFileSync(columnsPath, JSON.stringify(columns, null, 2), 'utf8');

        const tableData = [];
        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            const obj = {};

            if (!row || row.every(cell => cell === undefined || cell === null || cell === '')) {
                continue;
            }

            for (let j = 0; j < keys.length; j++) {
                const key = normalizeColumnKey(keys[j]);
                if (key) {
                    const value = row[j];
                    const type = types[j] || 'string';
                    obj[key] = convertByType(value, type, key);
                }
            }

            if (Object.keys(obj).length > 0) {
                tableData.push(obj);
            }
        }

        const completedTableData = fillMissingCampaignRows(tableData, columns);
        const transformedTableData = applyDataTransformation(completedTableData);
        const tableDataPath = path.join(OUTPUT_DIR, 'tableData.json');
        fs.writeFileSync(tableDataPath, JSON.stringify(transformedTableData, null, 2), 'utf8');
        console.log(`Successfully created ${tableDataPath}`);
    } catch (error) {
        console.error(`Error processing file ${filePath}:`, error.message);
    }
}

async function main() {
    const inputFile = findRootExcelInputFile();

    console.log('Starting Excel to JSON conversion...');
    console.log(`Input file: ${inputFile || '(none)'}`);
    console.log(`Output directory: ${OUTPUT_DIR}`);

    if (!inputFile) {
        console.error(`No Excel input file found in project root: ${__dirname}`);
        return;
    }

    await processExcelFile(inputFile);
    console.log('Conversion completed!');
}

async function googleAdsMain() {
    const inputFile = findRootExcelInputFile();

    console.log('Starting Google Ads workbook conversion...');
    console.log(`Input file: ${inputFile || '(none)'}`);
    console.log(`Output directory: ${OUTPUT_DIR}`);

    await processGoogleAdsWorkbook(inputFile);
    console.log('Google Ads conversion completed!');
}

// 导出函数，以便在其他文件中调用
module.exports = {
    findRootExcelInputFile,
    processExcelFile,
    processGoogleAdsWorkbook,
    googleAdsMain,
    main
};
