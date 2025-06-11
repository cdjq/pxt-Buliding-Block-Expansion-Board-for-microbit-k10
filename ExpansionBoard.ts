/**
 * Use this file to define custom functions and graphical blocks.
 * For more details, please visit https://makecode.microbit.org/blocks/custom
 */

// Motor selection enumeration
enum MyEnumMotor {
    //% block="M1"
    M1,
    //% block="M2"
    M2,
    //% block="M3"
    M3,
    //% block="M4"
    M4,
    //% block="ALL"
    ALL,
}

// Motor direction enumeration
enum MyEnumDir {
    //% block="forward"
    Forward,
    //% block="backward"
    Backward,
}

// Servo ports enumeration
enum Servos {
    //% blockId="S1" block="S1"
    S1,
    //% blockId="S2" block="S2"
    S2,
    //% blockId="S3" block="S3"
    S3,
    //% blockId="S4" block="S4"
    S4
}

// Example general-purpose enumeration
enum MyEnum {
    //% block="one"
    One,
    //% block="two"
    Two
}

// Pin number enumeration
enum PinNumber {
    //% block="C0"
    C0 = 0,
    //% block="C1"
    C1 = 1,
    //% block="C2"
    C2 = 2
}

// Pin mode enumeration
enum PinMode {
    //% block="ADC"
    ADC = 0,
    //% block="DHT11"
    DHT11 = 1,
    //% block="DHT22"
    DHT22 = 2,
    //% block="DS18B20"
    DS18B20 = 3,
    //% block="Digital OUT"
    WriteGpio = 4,
    //% block="Digital IN"
    ReadGpio = 5
}

// Pin state enumeration
enum PinState {
    //% block="low"
    Low = 0,
    //% block="high"
    High = 1
}

// Sensor type enumeration
enum SensorType {
    //% block="ADC"
    Analog = 0,
    //% block="digital in"
    Digital = 1,
    //% block="DHT11Temperature"
    DHT11Temperature = 2,
    //% block="DHT11Humidity"
    DHT11Humidity = 3,
    //% block="DHT22Temperature"
    DHT22Temperature = 4,
    //% block="DHT22Humidity"
    DHT22Humidity = 5,
    //% block="DS18B20Temperature"
    DS18B20Temperature = 6,
}

// 360-degree servo direction enumeration
enum Servo360Direction {
    //% block="stop"
    Stop = 0,
    //% block="forward"
    Forward = 1,
    //% block="backward"
    Backward = 2
}

/**
 * Custom blocks namespace for expansion board
 */
//% weight=100 color=#0fbc11 icon=""
namespace ExpansionBoard {
    const I2CADDR = 0x33;        // I2C device address
    const MAX_RETRIES = 5;       // Maximum retry attempts
    const RETRY_DELAY = 200;     // Retry delay in milliseconds

    // I2C read function with retry mechanism
    function i2cReadWithRetry(address: number, reg: number, length: number): Buffer {
        for (let i = 0; i < MAX_RETRIES; i++) {
            if (getVersion() == 0) {
                pins.i2cWriteNumber(address, reg, NumberFormat.UInt8BE);
                basic.pause(10);
                let buf = pins.i2cReadBuffer(address, length);
                if (buf && buf.length > 0) {
                    return buf;
                }
            }
            basic.pause(RETRY_DELAY);
        }
        return pins.createBuffer(length); // Return zero-filled buffer on failure
    }

    // I2C write function with retry mechanism
    function i2cWriteWithRetry(address: number, buffer: Buffer): boolean {
        for (let i = 0; i < MAX_RETRIES; i++) {
            if (getVersion() == 0) {
                pins.i2cWriteBuffer(address, buffer);
                return true;
            }
            basic.pause(10);
        }
        return false;
    }

    // Get firmware version (used for checking communication status)
    export function getVersion(): number {
        pins.i2cWriteNumber(I2CADDR, 0xF0, NumberFormat.UInt8BE);
        basic.pause(10);
        let buf = pins.i2cReadBuffer(I2CADDR, 1);
        if (buf && buf.length > 0 && buf[0] == 0x10) {
            return 0; // Communication successful
        }
        return -1; // Communication failed
    }

    // Set motor PWM period (used for initialization)
    function setMotorPWMPeriod(): void {
        let buf = pins.createBuffer(5);
        buf[0] = 0x00;
        buf[1] = 0x00;
        buf[2] = 0xFF;
        buf[3] = 0x00;
        buf[4] = 0xFF;
        i2cWriteWithRetry(I2CADDR, buf);
        basic.pause(500);
    }

    //% block="initialize device"
    //% weight=100
    export function initialize(): void {
        const DATA_ENABLE = 0x01;
        let buf = pins.createBuffer(2);
        buf[0] = 0xa0;  // Command to enable device
        buf[1] = DATA_ENABLE;
        i2cWriteWithRetry(I2CADDR, buf);
        basic.pause(500);
        setMotorPWMPeriod(); // Set initial PWM
    }

    //% block="read battery percentage"
    //% weight=10
    export function readBattery(): number {
        let buf = i2cReadWithRetry(I2CADDR, 0x87, 1);
        return buf[0];  // Return battery level (0–255)
    }

    //% block="set pin %pin mode %mode"
    //% weight=96
    export function setPinMode(pin: PinNumber, mode: PinMode): void {
        let buf = pins.createBuffer(2);
        buf[0] = 0x2c + pin;
        buf[1] = mode;
        i2cWriteWithRetry(I2CADDR, buf);
        basic.pause(10); // Delay for initialization
    }

    //% block="set pin %pin gpio state %value"
    //% weight=95
    export function setGpioState(pin: PinNumber, value: PinState): void {
        let buf = pins.createBuffer(2);
        buf[0] = 0x39 + pin;
        buf[1] = value;
        i2cWriteWithRetry(I2CADDR, buf);
    }

    //% weight=90
    //% blockId=servo_Servo block="servo|%index|angle|%angle"
    //% angle.min=0 angle.max=180
    export function servoRun(servo: Servos, angle: number): void {
        angle = Math.max(0, Math.min(180, angle)); // Clamp angle
        let period = 500 + angle * 11;
        let buf = pins.createBuffer(3);
        buf[0] = 0x1a + servo * 2;
        buf[1] = period >> 8;
        buf[2] = period & 0xFF;
        i2cWriteWithRetry(I2CADDR, buf);
    }

    //% block="set 360 servo %servo direction %direction speed %speed"
    //% weight=85
    //% speed.min=0 speed.max=100
    export function setServo360(servo: Servos, direction: Servo360Direction, speed: number): void {
        speed = Math.max(0, Math.min(100, speed)); // Clamp speed
        let period = 1500; // Default stop value

        if (speed > 0) {
            switch (direction) {
                case Servo360Direction.Forward:
                    period = Math.round(1450 - (speed * 4.5)); // Forward pulse width
                    break;
                case Servo360Direction.Backward:
                    period = Math.round(1550 + (speed * 4.5)); // Backward pulse width
                    break;
                default:
                    period = 1500; // Stop
                    break;
            }
        }

        let buf = pins.createBuffer(3);
        buf[0] = 0x18 + servo * 2;
        buf[1] = (period >> 8) & 0xFF;
        buf[2] = period & 0xFF;
        i2cWriteWithRetry(I2CADDR, buf);
    }

    //% block="set %emotor direction %edir speed %speed"
    //% speed.min=0 speed.max=255
    //% weight=99
    export function controlMotor(emotor: MyEnumMotor, edir: MyEnumDir, speed: number): void {
        const MOTOR_CMDS = {
            [MyEnumMotor.M1]: 0x04,
            [MyEnumMotor.M2]: 0x08,
            [MyEnumMotor.M3]: 0x0c,
            [MyEnumMotor.M4]: 0x10
        };

        // Helper function to create motor data buffer
        function createMotorData(cmd: number, dir: MyEnumDir, speed: number): Buffer {
            let buf = pins.createBuffer(5);
            buf[0] = cmd;
            if (dir == MyEnumDir.Forward) {
                buf[1] = 0x00;
                buf[2] = speed;
                buf[3] = 0x00;
                buf[4] = 0x00;
            } else {
                buf[1] = 0x00;
                buf[2] = 0x00;
                buf[3] = 0x00;
                buf[4] = speed;
            }
            return buf;
        }

        if (emotor == MyEnumMotor.ALL) {
            // Send a full 4-motor command
            let ALLBuf = pins.createBuffer(17);
            ALLBuf[0] = 0x04;
            for (let i = 0; i < 4; i++) {
                const offset = i * 4 + 1;
                if (edir == MyEnumDir.Forward) {
                    ALLBuf[offset] = 0x00;
                    ALLBuf[offset + 1] = speed;
                    ALLBuf[offset + 2] = 0x00;
                    ALLBuf[offset + 3] = 0x00;
                } else {
                    ALLBuf[offset] = 0x00;
                    ALLBuf[offset + 1] = 0x00;
                    ALLBuf[offset + 2] = 0x00;
                    ALLBuf[offset + 3] = speed;
                }
            }
            i2cWriteWithRetry(I2CADDR, ALLBuf);
        } else {
            let cmd = MOTOR_CMDS[emotor];
            let buf = createMotorData(cmd, edir, speed);
            i2cWriteWithRetry(I2CADDR, buf);
        }
    }
}
