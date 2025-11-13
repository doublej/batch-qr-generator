enum ErrorCorrectionLevel {
  L = 0, // 7%
  M = 1, // 15%
  Q = 2, // 25%
  H = 3, // 30%
}

interface QRCodeOptions {
  msg: string;
  ecl?: keyof typeof ErrorCorrectionLevel;
  ecb?: number; // error correction blocks, not used directly in this simplified version
  mtx?: number; // mask pattern, not used directly in this simplified version
  pal?: string[];
  dim?: number;
  pad?: number;
  vrb?: number;
}

interface DataSegment {
  modeBits: number;
  numBitsCharCount: number[];
  numChars: number;
  bitData: number[];
}

class QRCodeGenerator {
  private version: number = 0; // QR Code version (1-40)
  private errorCorrectionLevel: [number, number] = [ErrorCorrectionLevel.M, 1]; // [index in eccWordsPerBlockLookup, index in numBlocksLookup]
  private maskPattern: number = -1; // Mask pattern (0-7)
  private moduleCount: number = 0; // Size of the QR code (e.g., 21 for version 1)
  private qrCodeMatrix: number[][] = []; // The QR code grid (0 for white, 1 for black)
  private isFixedModule: boolean[][] = []; // Marks modules that are part of fixed patterns

  // Precomputed lookup tables for error correction
  private static readonly ECC_WORDS_PER_BLOCK_LOOKUP: number[][] = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  ];

  private static readonly NUM_BLOCKS_LOOKUP: number[][] = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
  ];

  private static readonly ERROR_CORRECTION_LEVELS_MAP = {
    L: [ErrorCorrectionLevel.L, 1],
    M: [ErrorCorrectionLevel.M, 0],
    Q: [ErrorCorrectionLevel.Q, 3],
    H: [ErrorCorrectionLevel.H, 2],
  };

  private static readonly NUMERIC_REGEX = /^[0-9]*$/;
  private static readonly ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/;
  private static readonly ALPHANUMERIC_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

  private options: QRCodeOptions;

  constructor(options: string | QRCodeOptions) {
    this.options = typeof options === "string" ? { msg: options } : options || {};
    this.options.ecl = this.options.ecl || "M";
    this.options.ecb = this.options.ecb === 0 ? 0 : 1; // Default to 1 if not explicitly 0
    this.options.mtx = this.options.mtx === undefined ? -1 : this.options.mtx;

    const dataSegments = this.encodeData(
      this.options.msg || "",
      QRCodeGenerator.ERROR_CORRECTION_LEVELS_MAP[this.options.ecl][0], // Use numeric level directly here
      this.options.ecb === 0 ? true : false,
      this.options.mtx,
    );

    this.buildQRCodeMatrix(
      dataSegments.version,
      QRCodeGenerator.ERROR_CORRECTION_LEVELS_MAP[this.options.ecl],
      dataSegments.encodedData,
      this.options.mtx,
    );
  }

  private setModule(row: number, col: number, isBlack: boolean): void {
    this.qrCodeMatrix[col][row] = isBlack ? 1 : 0;
    this.isFixedModule[col][row] = true;
  }

  private static getBitFromByte(byte: number, bitPosition: number): boolean {
    return ((byte >>> bitPosition) & 1) !== 0;
  }

  private static appendBitsToArray(value: number, numBits: number, bitArray: number[]): void {
    for (let i = numBits; i--;) {
      bitArray.push((value >>> i) & 1);
    }
  }

  private static getCharCountIndicatorBitLength(
    dataSegment: DataSegment,
    version: number,
  ): number {
    const q = Math.floor((version + 7) / 17);
    return dataSegment.numBitsCharCount[q];
  }

  private static multiplyGaloisField(a: number, b: number): number {
    let product = 0;
    for (let i = 8; i--;) {
      product = product << 1 ^ (285 * (product >>> 7)) ^ ((b >>> i) & 1) * a;
    }
    return product;
  }

  private static reedSolomonEncode(data: number[], generatorPolynomial: number[]): number[] {
    const remainder = Array(generatorPolynomial.length).fill(0);
    const dataLength = data.length;

    for (let i = 0; i < dataLength; i++) {
      const factor = data[i] ^ remainder.shift()!;
      for (let j = 0; j < generatorPolynomial.length; j++) {
        remainder[j] ^= QRCodeGenerator.multiplyGaloisField(generatorPolynomial[j], factor);
      }
    }
    return remainder;
  }

  private static getTotalDataBytes(version: number, errorCorrectionLevel: [number, number]): number {
    return (
      Math.floor(QRCodeGenerator.calculateTotalModuleCapacity(version) / 8) -
      QRCodeGenerator.ECC_WORDS_PER_BLOCK_LOOKUP[errorCorrectionLevel[0]][version] *
      QRCodeGenerator.NUM_BLOCKS_LOOKUP[errorCorrectionLevel[0]][version]
    );
  }

  private static calculateTotalModuleCapacity(version: number): number {
    if (version < 1 || version > 40) {
      throw new Error("Version number out of range");
    }
    let capacity = (16 * version + 128) * version + 64;
    if (version >= 2) {
      const t = Math.floor(version / 7) + 2;
      capacity -= (25 * t - 10) * t - 55;
      if (version >= 7) {
        capacity -= 36;
      }
    }
    return capacity;
  }

  // Encodes a numeric string into a DataSegment
  private encodeNumericSegment(data: string): DataSegment {
    if (!QRCodeGenerator.NUMERIC_REGEX.test(data)) {
      throw new Error("String contains non-numeric characters");
    }
    const bitArray: number[] = [];
    let currentIndex = 0;
    while (currentIndex < data.length) {
      const charsToEncode = Math.min(data.length - currentIndex, 3);
      const value = parseInt(data.substring(currentIndex, currentIndex + charsToEncode), 10);
      QRCodeGenerator.appendBitsToArray(value, 3 * charsToEncode + 1, bitArray);
      currentIndex += charsToEncode;
    }
    return { modeBits: 1, numBitsCharCount: [10, 12, 14], numChars: data.length, bitData: bitArray };
  }

  // Encodes an alphanumeric string into a DataSegment
  private encodeAlphanumericSegment(data: string): DataSegment {
    if (!QRCodeGenerator.ALPHANUMERIC_REGEX.test(data)) {
      throw new Error("String contains unencodable characters in alphanumeric mode");
    }
    const bitArray: number[] = [];
    let i = 0;
    for (; i + 2 <= data.length; i += 2) {
      let value = 45 * QRCodeGenerator.ALPHANUMERIC_CHARS.indexOf(data.charAt(i));
      value += QRCodeGenerator.ALPHANUMERIC_CHARS.indexOf(data.charAt(i + 1));
      QRCodeGenerator.appendBitsToArray(value, 11, bitArray);
    }
    if (i < data.length) {
      QRCodeGenerator.appendBitsToArray(
        QRCodeGenerator.ALPHANUMERIC_CHARS.indexOf(data.charAt(i)),
        6,
        bitArray,
      );
    }
    return {
      modeBits: 2,
      numBitsCharCount: [9, 11, 13],
      numChars: data.length,
      bitData: bitArray,
    };
  }

  // Encodes a URI-encoded string into a byte array for byte mode
  private encodeUriToBytes(uri: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < uri.length; i++) {
      if (uri.charAt(i) === "%") {
        bytes.push(parseInt(uri.substring(i + 1, i + 3), 16));
        i += 2;
      } else {
        bytes.push(uri.charCodeAt(i));
      }
    }
    return bytes;
  }

  // Encodes a byte string into a DataSegment
  private encodeByteSegment(data: string): DataSegment {
    const encodedBytes = this.encodeUriToBytes(encodeURI(data));
    const bitArray: number[] = [];
    for (const byte of encodedBytes) {
      QRCodeGenerator.appendBitsToArray(byte, 8, bitArray);
    }
    return {
      modeBits: 4,
      numBitsCharCount: [8, 16, 16],
      numChars: encodedBytes.length,
      bitData: bitArray,
    };
  }

  // Determines encoding mode and generates data segments
  private encodeData(
    data: string,
    errorCorrectionLevelValue: ErrorCorrectionLevel,
    isECBFixed: boolean,
    maskPattern: number,
  ): { version: number; encodedData: number[] } {
    let dataSegments: DataSegment[];

    if (data === "") {
      dataSegments = [];
    } else if (QRCodeGenerator.NUMERIC_REGEX.test(data)) {
      dataSegments = [this.encodeNumericSegment(data)];
    } else if (QRCodeGenerator.ALPHANUMERIC_REGEX.test(data)) {
      dataSegments = [this.encodeAlphanumericSegment(data)];
    } else {
      dataSegments = [this.encodeByteSegment(data)];
    }

    return this.packDataBits(
      dataSegments,
      errorCorrectionLevelValue,
      isECBFixed,
      maskPattern,
      1, // minVersion
      40, // maxVersion
    );
  }

  // Calculates the total bit length for a given version and data segments
  private calculateTotalDataBitLength(dataSegments: DataSegment[], version: number): number {
    let totalLength = 0;
    for (const segment of dataSegments) {
      const charCountBits = QRCodeGenerator.getCharCountIndicatorBitLength(segment, version);
      if (1 << charCountBits <= segment.numChars) {
        return Infinity; // Data too long for this version/mode
      }
      totalLength += 4 + charCountBits + segment.bitData.length;
    }
    return totalLength;
  }

  // Packs data bits, adds terminator and padding, and determines the optimal version
  private packDataBits(
    dataSegments: DataSegment[],
    errorCorrectionLevelValue: ErrorCorrectionLevel,
    isECBFixed: boolean,
    maskPattern: number,
    minVersion: number = 1,
    maxVersion: number = 40,
  ): { version: number; encodedData: number[] } {
    if (
      !(minVersion >= 1 && minVersion <= maxVersion && maxVersion <= 40) ||
      !(maskPattern >= -1 && maskPattern <= 7)
    ) {
      throw new Error("Invalid input values");
    }

    const packedBits: number[] = [];
    const encodedBytes: number[] = [];

    // Find the smallest version that can hold the data
    let version = minVersion;
    while (true) {
      const dataBitLength = this.calculateTotalDataBitLength(dataSegments, version);
      if (
        dataBitLength <=
        8 *
        QRCodeGenerator.getTotalDataBytes(version, [
          errorCorrectionLevelValue,
          errorCorrectionLevelValue,
        ])
      ) {
        break;
      }
      if (version >= maxVersion) {
        throw new Error("Data too long for any QR Code version");
      }
      version++;
    }

    // Adjust error correction level if not fixed and a higher level can fit
    if (isECBFixed) {
      const availableErrorCorrectionLevels = [
        QRCodeGenerator.ERROR_CORRECTION_LEVELS_MAP.H,
        QRCodeGenerator.ERROR_CORRECTION_LEVELS_MAP.Q,
        QRCodeGenerator.ERROR_CORRECTION_LEVELS_MAP.M,
      ]; // Order from highest to lowest capacity

      for (const level of availableErrorCorrectionLevels) {
        if (
          this.calculateTotalDataBitLength(dataSegments, version) <=
          8 * QRCodeGenerator.getTotalDataBytes(version, level)
        ) {
          this.errorCorrectionLevel = level;
          break;
        }
      }
    } else {
      this.errorCorrectionLevel = QRCodeGenerator.ERROR_CORRECTION_LEVELS_MAP[this.options.ecl!];
    }


    // Append mode indicator, character count indicator, and data bits
    for (const segment of dataSegments) {
      QRCodeGenerator.appendBitsToArray(segment.modeBits, 4, packedBits);
      QRCodeGenerator.appendBitsToArray(
        segment.numChars,
        QRCodeGenerator.getCharCountIndicatorBitLength(segment, version),
        packedBits,
      );
      for (const bit of segment.bitData) {
        packedBits.push(bit);
      }
    }

    // Add terminator bits
    const totalCodewordCapacityBits =
      8 *
      QRCodeGenerator.getTotalDataBytes(version, [
        errorCorrectionLevelValue,
        errorCorrectionLevelValue,
      ]);
    if (packedBits.length > totalCodewordCapacityBits) {
      throw new Error("Assertion error: packedBits length exceeds capacity after encoding");
    }
    QRCodeGenerator.appendBitsToArray(0, Math.min(4, totalCodewordCapacityBits - packedBits.length), packedBits);

    // Make bit array a multiple of 8
    QRCodeGenerator.appendBitsToArray(
      0,
      (8 - (packedBits.length % 8)) % 8,
      packedBits,
    );
    if (packedBits.length % 8 !== 0) {
      throw new Error("Assertion error: packedBits length not a multiple of 8");
    }

    // Add padding bytes
    let paddingByte = 236; // 0b11101100
    while (packedBits.length < totalCodewordCapacityBits) {
      QRCodeGenerator.appendBitsToArray(paddingByte, 8, packedBits);
      paddingByte ^= 253; // 0b11111101
    }

    // Convert bit array to byte array
    for (let i = 0; i < packedBits.length; i++) {
      if (i % 8 === 0) {
        encodedBytes.push(0);
      }
      encodedBytes[Math.floor(i / 8)] |= packedBits[i] << (7 - (i % 8));
    }

    return { version: version, encodedData: encodedBytes };
  }

  // Interleaves data codewords and error correction codewords
  private interleaveCodewordsAndECC(
    dataCodewords: number[],
    version: number,
    errorCorrectionLevel: [number, number],
  ): number[] {
    const eccLevelIndex = errorCorrectionLevel[0];
    const numBlocks = QRCodeGenerator.NUM_BLOCKS_LOOKUP[eccLevelIndex][version];
    const eccWordsPerBlock = QRCodeGenerator.ECC_WORDS_PER_BLOCK_LOOKUP[eccLevelIndex][version];
    const totalDataCodewords = QRCodeGenerator.getTotalDataBytes(version, errorCorrectionLevel);

    if (dataCodewords.length !== totalDataCodewords) {
      throw new Error("Invalid argument: dataCodewords length mismatch");
    }

    // Calculate block sizes and generator polynomial
    const totalCapacityBytes = Math.floor(QRCodeGenerator.calculateTotalModuleCapacity(version) / 8);
    const numLongBlocks = totalCapacityBytes % numBlocks; // Number of blocks with 1 extra data codeword
    const numShortBlocks = numBlocks - numLongBlocks;
    const dataCodewordsPerShortBlock = Math.floor(totalDataCodewords / numBlocks);
    const dataCodewordsPerLongBlock = dataCodewordsPerShortBlock + 1;

    const generatorPolynomial = (function (degree: number) {
      const poly: number[] = [];
      poly[degree - 1] = 1;
      for (let i = 0; i < degree; i++) {
        let n = 1;
        for (let j = 0; j < degree; j++) {
          poly[j] = QRCodeGenerator.multiplyGaloisField(poly[j], n) ^ poly[j + 1];
        }
        n = QRCodeGenerator.multiplyGaloisField(n, 2);
      }
      return poly;
    })(eccWordsPerBlock);

    let currentDataIndex = 0;
    const dataBlocks: number[][] = [];
    for (let i = 0; i < numBlocks; i++) {
      const dataBlockSize = i < numShortBlocks ? dataCodewordsPerShortBlock : dataCodewordsPerLongBlock;
      const dataBlock = dataCodewords.slice(currentDataIndex, currentDataIndex + dataBlockSize);
      currentDataIndex += dataBlockSize;
      dataBlocks.push(dataBlock);
    }

    const interleavedOutput: number[] = [];
    // Interleave data and ECC codewords
    for (let i = 0; i < dataBlocks[0].length; i++) {
      for (let j = 0; j < numBlocks; j++) {
        if (i < dataBlocks[j].length) {
          interleavedOutput.push(dataBlocks[j][i]);
        }
      }
    }

    // Generate ECC codewords for each block and interleave them
    const eccBlocks: number[][] = dataBlocks.map(block => QRCodeGenerator.reedSolomonEncode(block, generatorPolynomial));
    for (let i = 0; i < eccWordsPerBlock; i++) {
      for (let j = 0; j < numBlocks; j++) {
        interleavedOutput.push(eccBlocks[j][i]);
      }
    }
    return interleavedOutput;
  }

  // Draws a finder pattern at a specified corner
  private drawFinderPattern(col: number, row: number): void {
    // The original JS `I` function iterates t, o from 2 down to -2, covering a 5x5 area.
    // The condition was `i(h(o), h(t)) != 1` which translates to `Math.max(Math.abs(dx), Math.abs(dy)) !== 1`.
    // This draws the outer square (distance 2) and the center (distance 0), forming a 7x7 pattern with a 5x5 white square inside, and a 3x3 black square in the very center.
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const isBlack = Math.max(Math.abs(dx), Math.abs(dy)) !== 1;
        // Ensure we don't draw outside the QR code boundary, though isFixedModule should also handle this
        const currentTargetCol = col + dx;
        const currentTargetRow = row + dy;
        if (currentTargetCol >= 0 && currentTargetCol < this.moduleCount &&
            currentTargetRow >= 0 && currentTargetRow < this.moduleCount) {
          this.setModule(currentTargetCol, currentTargetRow, isBlack);
        }
      }
    }
  }


  // Draws an alignment pattern
  private drawAlignmentPattern(col: number, row: number): void {
    // The original JS `H` function iterates t, o from 4 down to -4, covering a 9x9 area.
    // The condition for drawing a black module was `a != 2 && a != 4` where `a` is Math.max(Math.abs(dx), Math.abs(dy)).
    for (let dy = -4; dy <= 4; dy++) { // Iterate 9 times
      for (let dx = -4; dx <= 4; dx++) { // Iterate 9 times
        const isBlack = Math.max(Math.abs(dx), Math.abs(dy)) !== 2 && Math.max(Math.abs(dx), Math.abs(dy)) !== 4;
        // Ensure we don't draw outside the QR code boundary, though isFixedModule should also handle this
        const currentTargetCol = col + dx;
        const currentTargetRow = row + dy;
        if (currentTargetCol >= 0 && currentTargetCol < this.moduleCount &&
            currentTargetRow >= 0 && currentTargetRow < this.moduleCount) {
          this.setModule(currentTargetCol, currentTargetRow, isBlack);
        }
      }
    }
  }

  // Sets the format information bits
  private setFormatInformation(maskPattern: number): void {
    const errorCorrectionLevelBits = this.errorCorrectionLevel[1] << 3 | maskPattern;
    let formatInfo = errorCorrectionLevelBits;

    // BCH (15,5) code generation for format information
    // Generator polynomial: x^10 + x^8 + x^5 + x^4 + x^2 + x^1 + x^0 (0x537, 1010010111 in binary)
    // The original code uses 1335 for 0x537, which is correct.
    for (let i = 0; i < 10; i++) {
      formatInfo = formatInfo << 1 ^ (1335 * (formatInfo >>> 9));
    }
    const finalFormatInfo = 21522 ^ (errorCorrectionLevelBits << 10 | formatInfo); // XOR with 0x5412 (101010000010010)

    if (finalFormatInfo >>> 15 !== 0) {
      throw new Error("Assertion error: format info calculation overflow");
    }

    // Place format information in the top-left, top-right, and bottom-left finder patterns
    // Top-left vertical
    for (let i = 0; i <= 5; i++) {
      this.setModule(8, i, QRCodeGenerator.getBitFromByte(finalFormatInfo, i));
    }
    this.setModule(8, 7, QRCodeGenerator.getBitFromByte(finalFormatInfo, 6));
    this.setModule(8, 8, QRCodeGenerator.getBitFromByte(finalFormatInfo, 7));
    this.setModule(7, 8, QRCodeGenerator.getBitFromByte(finalFormatInfo, 8));

    // Top-left horizontal
    for (let i = 9; i < 15; i++) {
      this.setModule(14 - i, 8, QRCodeGenerator.getBitFromByte(finalFormatInfo, i));
    }

    // Bottom-left vertical (reversed)
    for (let i = 0; i < 8; i++) {
      this.setModule(this.moduleCount - 1 - i, 8, QRCodeGenerator.getBitFromByte(finalFormatInfo, i));
    }

    // Top-right horizontal (reversed)
    for (let i = 8; i < 15; i++) {
      this.setModule(8, this.moduleCount - 15 + i, QRCodeGenerator.getBitFromByte(finalFormatInfo, i));
    }

    // Dark module (always black)
    this.setModule(8, this.moduleCount - 8, true);
  }

  // Initializes the QR code grid with fixed patterns
  private initializeFixedPatterns(): void {
    // Timing patterns
    for (let i = this.moduleCount; i--;) {
      this.setModule(6, i, i % 2 === 0);
      this.setModule(i, 6, i % 2 === 0);
    }

    // Alignment patterns (excluding the three finder pattern areas)
    const alignmentPatternCenters: number[] = (() => {
      const centers: number[] = [];
      if (this.version > 1) {
        const numAlignmentPatterns = Math.floor(this.version / 7) + 2;
        const baseCoord =
          this.version === 32 ? 26 : 2 * Math.ceil((this.moduleCount - 13) / (2 * numAlignmentPatterns - 2));

        for (let i = 0; i < numAlignmentPatterns; i++) {
          centers[i] = i * baseCoord + 6;
        }
      }
      return centers;
    })();

    for (let rowIdx = alignmentPatternCenters.length; rowIdx--;) {
      for (let colIdx = alignmentPatternCenters.length; colIdx--;) {
        // Skip positions that would overlap with finder patterns
        if (
          (colIdx !== 0 || rowIdx !== 0) && // Top-left
          (colIdx !== 0 || rowIdx !== alignmentPatternCenters.length - 1) && // Bottom-left
          (colIdx !== alignmentPatternCenters.length - 1 || rowIdx !== 0) // Top-right
        ) {
          this.drawAlignmentPattern(
            alignmentPatternCenters[colIdx],
            alignmentPatternCenters[rowIdx],
          );
        }
      }
    }

    // Finder patterns (top-left, top-right, bottom-left)
    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(this.moduleCount - 4, 3);
    this.drawFinderPattern(3, this.moduleCount - 4);

    // Placeholder for format and version information (will be set later)
    this.setFormatInformation(0); // Temporary mask pattern 0, will be overwritten

    // Version information (for versions >= 7)
    if (this.version >= 7) {
      let versionInfo = this.version;
      // BCH (18,6) code generation for version information
      // Generator polynomial: x^12 + x^11 + x^10 + x^9 + x^8 + x^5 + x^2 + x^0 (0x1F25, 1111100100101 in binary)
      // The original code uses 7973 for 0x1F25, which is correct.
      for (let i = 0; i < 12; i++) {
        versionInfo = versionInfo << 1 ^ (7973 * (versionInfo >>> 11));
      }
      const finalVersionInfo = (this.version << 12) | versionInfo;

      if (finalVersionInfo >>> 18 !== 0) {
        throw new Error("Assertion error: version info calculation overflow");
      }

      // Place version information
      // Top-right 3x6 area
      for (let i = 0; i < 18; i++) {
        const col = this.moduleCount - 11 + (i % 3);
        const row = Math.floor(i / 3);
        this.setModule(col, row, QRCodeGenerator.getBitFromByte(finalVersionInfo, i));
      }
      // Bottom-left 6x3 area
      for (let i = 0; i < 18; i++) {
        const col = Math.floor(i / 3);
        const row = this.moduleCount - 11 + (i % 3);
        this.setModule(col, row, QRCodeGenerator.getBitFromByte(finalVersionInfo, i));
      }
    }
  }

  // Builds the QR code matrix by placing fixed patterns, data, and applying masking
  private buildQRCodeMatrix(
    version: number,
    errorCorrectionLevel: [number, number],
    encodedData: number[],
    maskPattern: number,
  ): void {
    this.version = version;
    this.errorCorrectionLevel = errorCorrectionLevel;
    this.moduleCount = 4 * this.version + 17;

    // Initialize matrices
    for (let i = 0; i < this.moduleCount; i++) {
      this.qrCodeMatrix[i] = new Array(this.moduleCount).fill(0);
      this.isFixedModule[i] = new Array(this.moduleCount).fill(false);
    }

    this.initializeFixedPatterns();

    // Place data codewords
    let dataBitIndex = 0;
    let direction = -1; // -1 for up, 1 for down
    let col = this.moduleCount - 1;

    for (; col > 0; col -= 2) {
      if (col === 6) {
        col--; // Skip timing pattern column
      }

      let row = direction === -1 ? this.moduleCount - 1 : 0;

      for (let i = 0; i < this.moduleCount; i++) {
        for (let dx = 0; dx < 2; dx++) {
          const currentCol = col - dx;
          const currentRow = row;

          if (!this.isFixedModule[currentRow][currentCol]) {
            if (dataBitIndex < encodedData.length * 8) { // Ensure we don't read beyond the end of encodedData bits
              const byteIndex = Math.floor(dataBitIndex / 8);
              const bitInByteIndex = 7 - (dataBitIndex % 8);
              const bitValue = QRCodeGenerator.getBitFromByte(encodedData[byteIndex], bitInByteIndex);
              this.setModule(currentCol, currentRow, bitValue);
              dataBitIndex++;
            }
          }
        }
        row += direction;
        if (row < 0 || row >= this.moduleCount) {
          direction = -direction;
          row = direction === -1 ? this.moduleCount - 1 : 0;
        }
      }
    }


    // Determine and apply mask pattern
    if (maskPattern < 0) {
      let bestPenaltyScore = Infinity;
      for (let i = 0; i < 8; i++) {
        this.applyMaskPattern(i);
        this.setFormatInformation(i); // Update format info with current mask
        const penalty = this.calculatePenaltyScore();
        if (penalty < bestPenaltyScore) {
          bestPenaltyScore = penalty;
          this.maskPattern = i;
        }
        this.applyMaskPattern(i); // Revert mask for next iteration
        this.setFormatInformation(0); // Revert format info
      }
    } else {
      this.maskPattern = maskPattern;
    }

    this.applyMaskPattern(this.maskPattern);
    this.setFormatInformation(this.maskPattern);

    this.isFixedModule = []; // Clear fixed modules after final matrix is built
  }

  // Applies a given mask pattern to the QR code matrix
  private applyMaskPattern(maskPattern: number): void {
    const maskFunction = [
      (c: number, r: number) => (c + r) % 2 === 0,
      (c: number, r: number) => c % 2 === 0,
      (c: number, r: number) => r % 3 === 0,
      (c: number, r: number) => (c + r) % 3 === 0,
      (c: number, r: number) => (Math.floor(c / 2) + Math.floor(r / 3)) % 2 === 0,
      (c: number, r: number) => (c * r) % 2 + (c * r) % 3 === 0,
      (c: number, r: number) => ((c * r) % 2 + (c * r) % 3) % 2 === 0,
      (c: number, r: number) => ((c + r) % 2 + (c * r) % 3) % 2 === 0,
    ][maskPattern];

    for (let r = this.moduleCount; r--;) {
      for (let c = this.moduleCount; c--;) {
        if (!this.isFixedModule[c][r]) {
          this.qrCodeMatrix[c][r] ^= maskFunction(c, r) ? 1 : 0;
        }
      }
    }
  }

  // Calculates the penalty score for a given mask pattern
  private calculatePenaltyScore(): number {
    let penalty = 0;
    const moduleCount = this.moduleCount;
    const matrix = this.qrCodeMatrix;

    // Rule 1: Adjacent modules in a row/column with the same color
    const checkConsecutive = (countArray: number[], value: number): void => {
      if (!countArray[6]) { // If not enough history, push value and shift
        countArray.push(value);
        countArray.shift();
      } else { // Shift and push value if enough history
        countArray.push(value);
        countArray.shift();
      }
    };

    const getFinderLikePatternPenalty = (countArray: number[]): number => {
      const centerCount = countArray[5]; // Should be countArray[1] for 1:1:3:1:1 pattern
      if (centerCount > 0 &&
        countArray[4] === centerCount &&
        countArray[3] === 3 * centerCount &&
        countArray[2] === centerCount &&
        countArray[1] === centerCount
      ) {
        // Check for 1:1:3:1:1 pattern
        let score = 0;
        if (countArray[0] >= 4 * centerCount || countArray[6] >= 4 * centerCount) {
          score += 1;
        }
        if (countArray[0] >= 4 * centerCount && countArray[6] >= centerCount) {
          score += 1;
        }
        return score;
      }
      return 0;
    };

    for (let r = 0; r < moduleCount; r++) {
      let consecutiveRowModules = 0;
      let previousRowModuleColor = -1; // -1 for initial state, 0 for white, 1 for black
      const rowHistory: number[] = [0, 0, 0, 0, 0, 0, 0]; // For 1:1:3:1:1 detection

      let consecutiveColModules = 0;
      let previousColModuleColor = -1;
      const colHistory: number[] = [0, 0, 0, 0, 0, 0, 0]; // For 1:1:3:1:1 detection

      for (let c = 0; c < moduleCount; c++) {
        // Horizontal check
        const currentRowModule = matrix[c][r];
        if (currentRowModule === previousRowModuleColor) {
          consecutiveRowModules++;
        } else {
          if (consecutiveRowModules >= 5) {
            penalty += 3 + (consecutiveRowModules - 5);
          }
          checkConsecutive(rowHistory, consecutiveRowModules);
          penalty += 40 * getFinderLikePatternPenalty(rowHistory);
          consecutiveRowModules = 1;
          previousRowModuleColor = currentRowModule;
        }

        // Vertical check
        const currentColModule = matrix[r][c];
        if (currentColModule === previousColModuleColor) {
          consecutiveColModules++;
        } else {
          if (consecutiveColModules >= 5) {
            penalty += 3 + (consecutiveColModules - 5);
          }
          checkConsecutive(colHistory, consecutiveColModules);
          penalty += 40 * getFinderLikePatternPenalty(colHistory);
          consecutiveColModules = 1;
          previousColModuleColor = currentColModule;
        }

        // Rule 3: 2x2 blocks of same color
        if (
          r > 0 &&
          c > 0 &&
          matrix[c][r] === matrix[c - 1][r] &&
          matrix[c][r] === matrix[c][r - 1] &&
          matrix[c][r] === matrix[c - 1][r - 1]
        ) {
          penalty += 3;
        }
      }

      // Final check for the end of row/column for Rule 1
      if (consecutiveRowModules >= 5) {
        penalty += 3 + (consecutiveRowModules - 5);
      }
      checkConsecutive(rowHistory, consecutiveRowModules);
      penalty += 40 * getFinderLikePatternPenalty(rowHistory);

      if (consecutiveColModules >= 5) {
        penalty += 3 + (consecutiveColModules - 5);
      }
      checkConsecutive(colHistory, consecutiveColModules);
      penalty += 40 * getFinderLikePatternPenalty(colHistory);
    }

    // Rule 4: Ratio of dark to light modules
    let darkModulesCount = 0;
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (matrix[c][r] === 1) {
          darkModulesCount++;
        }
      }
    }
    const totalModules = moduleCount * moduleCount;
    const darkModuleRatio = (darkModulesCount * 100) / totalModules;
    const k = Math.abs(Math.floor(darkModuleRatio / 5) - 10);
    penalty += k * 10;

    return penalty;
  }

  // Renders the QR code matrix to an SVG element
  public toSVG(): SVGElement {
    const defaultPalette = ["#000"];
    const svgNamespace = "http://www.w3.org/2000/svg";

    const config = this.options;
    const palette = config.pal || defaultPalette;
    const dimension = Math.abs(config.dim || 256);
    const padding = Math.abs(config.pad !== undefined && config.pad > -1 ? config.pad : 4);
    const backgroundColor = palette[1];
    const foregroundColor = palette[0] || "#000";
    const usePathOptimization = config.vrb ? 0 : 1; // 0 for no optimization, 1 for path optimization

    const svgViewBoxSize = this.moduleCount + 2 * padding;
    let svgPathData = "";

    for (let r = 0; r < this.moduleCount; r++) {
      let consecutiveBlackModules = 0;
      for (let c = 0; c < this.moduleCount; c++) {
        if (this.qrCodeMatrix[c][r]) {
          if (usePathOptimization) {
            consecutiveBlackModules++;
            if (!this.qrCodeMatrix[c + 1]?.[r]) {
              // End of a black run
              svgPathData += `M${c + padding},${r + padding}h${consecutiveBlackModules}v1h-${consecutiveBlackModules}v-1z`;
              consecutiveBlackModules = 0;
            }
          } else {
            // No path optimization, draw individual squares
            svgPathData += `M${c + padding},${r + padding}h1v1h-1v-1z`;
          }
        }
      }
    }

    const svgElement = document.createElementNS(svgNamespace, "svg");
    svgElement.setAttribute("viewBox", `0 0 ${svgViewBoxSize} ${svgViewBoxSize}`);
    svgElement.setAttribute("width", dimension.toString());
    svgElement.setAttribute("height", dimension.toString());
    svgElement.setAttribute("fill", foregroundColor);
    svgElement.setAttribute("shape-rendering", "crispEdges");
    svgElement.setAttribute("xmlns", svgNamespace);
    svgElement.setAttribute("version", "1.1");

    if (backgroundColor && /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(backgroundColor)) {
      const backgroundRect = document.createElementNS(svgNamespace, "path");
      backgroundRect.setAttribute("fill", backgroundColor);
      backgroundRect.setAttribute("d", `M0,0V${svgViewBoxSize}H${svgViewBoxSize}V0H0Z`);
      svgElement.appendChild(backgroundRect);
    }

    const qrPath = document.createElementNS(svgNamespace, "path");
    qrPath.setAttribute("transform", `matrix(1 0 0 1 ${padding} ${padding})`);
    qrPath.setAttribute("d", svgPathData);
    svgElement.appendChild(qrPath);

    return svgElement;
  }
}

// Global function for compatibility with original usage
function generateQRCodeSVG(options: string | QRCodeOptions): SVGElement {
  const generator = new QRCodeGenerator(options);
  return generator.toSVG();
}
