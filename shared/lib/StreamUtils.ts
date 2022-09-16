type SchemaElement = number | [number, number];
type Schema = SchemaElement[];

interface BufferSchemaOptions {
    errorMessage: string;
}

export const BinaryTypes = {
    "u8": 0,
    "u16": 1,
    "str": 2,
    "f32": 3,
};

export const ByteSize = {
    [BinaryTypes.u8]: 1,
    [BinaryTypes.u16]: 2,
};

const DEBUG = false;

const assert = (condition: boolean, err: string) => {
    if (!condition) throw err;
};

export class BufferWriter {
    byteView: Uint8Array;
    arrayBuffer: ArrayBuffer;
    offset: number = 0;

    static F32Array = new Float32Array(1);
    static U8Array = new Uint8Array(BufferWriter.F32Array.buffer);

    constructor(bufferSize: number = 1024) {
        this.arrayBuffer = new ArrayBuffer(bufferSize);
        this.byteView = new Uint8Array(this.arrayBuffer);
    }

    maxSize(): number {
        return this.arrayBuffer.byteLength;
    }

    writeU8(u8: number) {
        if (DEBUG) assert(
            (Number.isInteger(u8) && (u8 >= 0 && u8 <= (1 << 16) - 1)),
            `invalid u8 provided: ${u8}`
        );

        if (DEBUG) assert(this.offset + 1 < this.maxSize(), `Writing u8 out of bounds ab[${this.offset}]`)

        this.byteView[this.offset++] = u8;
    }

    writeU16(u16: number) {
        if (DEBUG) assert(
            (Number.isInteger(u16) && (u16 >= 0 && u16 <= (1 << 16) - 1)),
            `invalid u16 provided: ${u16}`
        );

        if (DEBUG) assert(this.offset + 2 < this.maxSize(), `Writing u16 out of bounds ab[${this.offset}]`)

        this.byteView[this.offset++] = (u16 & 0xff);
        this.byteView[this.offset++] = ((u16 >> 8) & 0xff);
    }

    writeString(str: string) {
        const len = str.length;
        this.writeU8(len);
        for (let i = 0; i < len; i++) this.writeU8(str.charCodeAt(i));
    }

    writeLEB128(n: number) {
        if (DEBUG && (n < 0 || n !== Math.floor(n)))
            throw new Error("out of range 0-4294967295 provided:" + n);

        do {
            let byte = n & 0x7f;
            n >>>= 7;
            if (n !== 0) {
                byte |= 0x80;
            }
            this.byteView[this.offset++] = byte & 0xff;
        } while (n !== 0);
    }

    writeF32(n: number) {
        BufferWriter.F32Array[0] = n
        this.byteView[this.offset++] = BufferWriter.U8Array[0];
        this.byteView[this.offset++] = BufferWriter.U8Array[1];
        this.byteView[this.offset++] = BufferWriter.U8Array[2];
        this.byteView[this.offset++] = BufferWriter.U8Array[3];
    }

    writeU32(n: number) {
        this.byteView[this.offset++] = n & 0xff;
        this.byteView[this.offset++] = (n >> 8) & 0xff;
        this.byteView[this.offset++] = (n >> 16) & 0xff
        this.byteView[this.offset++] = (n >> 24) & 0xff;
    }

    getBytes(): ArrayBuffer {
        const copy = new Uint8Array(this.arrayBuffer, 0, this.offset).slice();
        return copy.buffer;
    }

    bytes() {
        return this.getBytes();
    }

    reset() {
        this.offset = 0;
    }
};

export class BufferReader {
    offset: number = 0;
    bytes: Uint8Array = new Uint8Array();

    static F32Array = new Float32Array(1);
    static U8Array = new Uint8Array(BufferReader.F32Array.buffer);

    size(): number {
        return this.bytes.length;
    }

    hasMoreData() {
        return this.offset !== this.bytes.length;
    }


    readF32(): number {
        BufferReader.U8Array[0] = this.bytes[this.offset++];
        BufferReader.U8Array[1] = this.bytes[this.offset++];
        BufferReader.U8Array[2] = this.bytes[this.offset++];
        BufferReader.U8Array[3] = this.bytes[this.offset++];
        return BufferReader.F32Array[0];
    }

    skipPacket() {
        this.offset = this.bytes.length;
    }

    readFrom(data: ArrayBuffer) {
        // maybe create a new copy of the arraybuffer to be safe?
        this.bytes = new Uint8Array(data);
        this.offset = 0;
    }

    readU8(): number {
        return this.bytes[this.offset++];
    }

    readU16(): number {
        return this.bytes[this.offset++] | (this.bytes[this.offset++] << 8);
    }

    // TODO, add support for utf16
    readString(): string {
        let str = "";
        const len = this.readU8();
        for (let i = 0; i < len; i++) str += String.fromCharCode(this.readU8());
        return str;
    }
};

export class SchemaCollection {
    schemas: BufferSchema[];
    constructor(schemas: BufferSchema[]) {
        this.schemas = schemas;
    }

    validate(bufferReader: BufferReader) {
        let offset = 0;
        const schemas = this.schemas;
        for (let i = 0; i < schemas.length; i++) {
            const schema = schemas[i];
            offset = schema.validate(bufferReader, offset);
        }
    }
}

export class BufferSchema {
    schema: Schema;
    errorMessage: string;
    returnData: any[];

    constructor(schema: Schema, options: BufferSchemaOptions) {
        this.schema = schema;
        this.errorMessage = options.errorMessage;
        this.returnData = [];
    }

    readData(bufferReader: BufferReader): any[] {
        const schema = this.schema;
        for (let i = 0; i < schema.length; i++) {
            const schemaElement = schema[i];

            if (Array.isArray(schemaElement)) {
                let totalElements = schemaElement[0];
                let elementType = schemaElement[1];
                let arr: any[] = [];
                for (let u = 0; u < totalElements; u++) {
                    switch (elementType) {
                        case BinaryTypes.u8:
                            arr.push(bufferReader.readU8());
                            break;
                        case BinaryTypes.u16:
                            arr.push(bufferReader.readU16());
                            break;
                        case BinaryTypes.str:
                            arr.push(bufferReader.readString());
                            break;
                        case BinaryTypes.f32:
                            arr.push(bufferReader.readF32());
                            break;
                        default:
                            throw "Schema::readData unknown BinaryType: " + elementType;
                    }
                }
                this.returnData[i] = arr;
            } else {
                let elementType = schemaElement;
                switch (elementType) {
                    case BinaryTypes.u8:
                        this.returnData[i] = bufferReader.readU8();
                        break;
                    case BinaryTypes.u16:
                        this.returnData[i] = bufferReader.readU16();
                        break;
                    case BinaryTypes.str:
                        this.returnData[i] = bufferReader.readString();
                        break;
                    case BinaryTypes.f32:
                        this.returnData[i] = bufferReader.readF32();
                        break;
                    default:
                        throw "Schema::readData unknown BinaryType: " + elementType;
                }
            }
        }

        return this.returnData;
    }

    /*
    *
    */
    validate(bufferReader: BufferReader, offset = 0): number {
        const schema = this.schema;
        const bufferSize = bufferReader.size();

        for (let i = 0; i < schema.length; i++) {
            const schemaElement = schema[i];
            let totalElements = 1;
            let elementType = -1;

            if (Array.isArray(schemaElement)) {
                totalElements = schemaElement[0];
                elementType = schemaElement[1];
            } else {
                elementType = schemaElement;
            }

            for (let u = 0; u < totalElements; u++) {
                switch (elementType) {
                    case BinaryTypes.u8:
                        offset += 1;
                        break;
                    case BinaryTypes.u16:
                        offset += 2;
                        break;
                    case BinaryTypes.f32:
                        offset += 2;
                        break;
                    case BinaryTypes.str:
                        if (offset >= bufferSize) throw this.errorMessage;
                        // TODO, when adding UTF-16 support, dont forget to make this increase the offset by 2 bytes at a time
                        // ie offset += len * 2
                        const len = bufferReader.bytes[offset++];
                        offset += len;
                        break;
                    default:
                        throw "Schema::validate unknown BinaryType: " + elementType;
                }

            }

            if (offset > bufferSize) throw this.errorMessage;
        }

        return offset;
    }
};