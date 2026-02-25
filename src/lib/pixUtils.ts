/**
 * Pix Utility for generating valid BR Code (Copia e Cola)
 * Following the EMV QRCPS Merchant-Presented Mode standard
 */

export interface PixConfig {
    key: string;
    beneficiaryName: string;
    city: string;
    amount?: number;
    description?: string;
    transactionId?: string;
}

function crc16(data: string): string {
    let crc = 0xFFFF;
    const polynomial = 0x1021;

    for (let i = 0; i < data.length; i++) {
        let b = data.charCodeAt(i);
        for (let j = 0; j < 8; j++) {
            let bit = ((b >> (7 - j) & 1) === 1);
            let c15 = ((crc >> 15 & 1) === 1);
            crc <<= 1;
            if (c15 !== bit) crc ^= polynomial;
        }
    }

    crc &= 0xFFFF;
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatField(id: string, value: string): string {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
}

export function generatePixCode(config: PixConfig): string {
    const { key, beneficiaryName, city, amount, description, transactionId = '***' } = config;

    // 00: Payload Format Indicator
    let payload = formatField('00', '01');

    // 26: Merchant Account Information - Pix
    const gui = formatField('00', 'br.gov.bcb.pix');
    const keyField = formatField('01', key);
    // Optional description (02) - many banks use this for Info Adicional
    const infoAdicional = description ? formatField('02', description) : '';
    payload += formatField('26', `${gui}${keyField}${infoAdicional}`);

    // 52: Merchant Category Code
    payload += formatField('52', '0000');

    // 53: Transaction Currency (BRL = 986)
    payload += formatField('53', '986');

    // 54: Transaction Amount
    if (amount && amount > 0) {
        payload += formatField('54', amount.toFixed(2));
    }

    // 58: Country Code
    payload += formatField('58', 'BR');

    // 59: Merchant Name
    // Strip accents and limit to 25 chars for safety
    const cleanName = beneficiaryName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25);
    payload += formatField('59', cleanName);

    // 60: Merchant City
    const cleanCity = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 15);
    payload += formatField('60', cleanCity);

    // 62: Additional Data Field Template
    const txIdField = formatField('05', transactionId.substring(0, 25));
    payload += formatField('62', txIdField);

    // 63: CRC16
    payload += '6304';
    const crc = crc16(payload);
    
    return payload + crc;
}
