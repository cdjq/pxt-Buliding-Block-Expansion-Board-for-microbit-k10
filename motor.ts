import { PinNumber } from './motor';
// 在此处添加您的代码
//% weight=100 color=#0fbc11 icon="\uf067" block="motor"
namespace motor {
    const I2CADDR = 0x33;
    const MAX_RETRIES = 5;  // 最大重试次数
    const RETRY_DELAY = 200;  // 重试间隔(ms)

    // 带重试机制的I2C写入函数
    function i2cWriteWithRetry(address: number, buffer: Buffer): boolean {
        for (let i = 0; i < MAX_RETRIES; i++) {
            try {
                pins.i2cWriteBuffer(address, buffer);
                return true;
            } catch (e) {
                if (i < MAX_RETRIES - 1) {
                    basic.pause(RETRY_DELAY);
                }
            }
        }
        return false;
    }

    // 带重试机制的I2C读取函数
    function i2cReadWithRetry(address: number, reg: number, length: number): Buffer {
        for (let i = 0; i < MAX_RETRIES; i++) {
            try {
                pins.i2cWriteNumber(I2CADDR, reg, NumberFormat.UInt8BE);
                basic.pause(10);
                let buf = pins.i2cReadBuffer(I2CADDR, length);
                if (buf && buf.length > 0) {
                    return buf;
                }
            } catch (e) {
                // 读取失败，等待后重试
                basic.pause(RETRY_DELAY);
            }
        }
        return pins.createBuffer(0);  // 返回空缓冲区表示读取失败
    }

    //Motor selection enumeration
    export enum MyEnumMotor {
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
    };

    //Motor direction enumeration selection
    export enum MyEnumDir {
        //% block="rotate forward"
        Forward,
        //% block="backward"
        Backward,
    };

    export enum Servos {
        //% blockId="S1" block="S1"
        S1,
        //% blockId="S2" block="S2"
        S2,
        //% blockId="S3" block="S3"
        S3,
        //% blockId="S4" block="S4"
        S4
    }
    
    //% block="set %emotor direction %edir speed %speed"
    //% speed.min=0 speed.max=255
    //% weight=99
    export function controlMotor(emotor: MyEnumMotor, edir: MyEnumDir, speed: number): void {
        // 电机命令地址映射
        const MOTOR_CMDS = {
            [MyEnumMotor.M1]: 0x04,
            [MyEnumMotor.M2]: 0x08,
            [MyEnumMotor.M3]: 0x0c,
            [MyEnumMotor.M4]: 0x10
        };

        // 创建电机控制数据
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
            // 控制所有电机
            let ALLBuf = pins.createBuffer(17);
            ALLBuf[0] = 0x04;
            
            // 为每个电机设置控制数据
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
            // 控制单个电机
            const cmd = MOTOR_CMDS[emotor];
            const buf = createMotorData(cmd, edir, speed);
            i2cWriteWithRetry(I2CADDR, buf);
        }
    }

    //% block="set %emotor stop"
    //% weight=98
    export function controlMotorStop(emotor: MyEnumMotor): void {
        // 停止电机就是设置速度为0
        controlMotor(emotor, MyEnumDir.Forward, 0);
    }
    //% weight=90
    //% blockId=servo_ServoRun block="servo|%index|angle|%angle"
    //% angle.min=0 angle.max=360
    export function servoRun(servo: Servos, angle: number): void {
        // 限制角度范围在0-180之间
        angle = Math.max(0, Math.min(180, angle));
        
        // 将角度0-180映射到500-2500
        let pwmValue = Math.round(500 + (angle * 2000 / 180));
        
        let buf = pins.createBuffer(3);
        buf[0] = 0x18+servo*2/ 设置舵机角度的命令
        buf[1] = pwmValue >> 8;
        buf[2] = pwmValue & 0xFF;
        i2cWriteWithRetry(I2CADDR, buf);
    }

    
    //% block="read battery level"
    //% weight=10
    export function readBattery(): number {
        let buf = i2cReadWithRetry(I2CADDR, 0x87, 1);
        return buf[0];  // 直接返回0-100的电量值
    }

    // 引脚序号枚举
    export enum PinNumber {
        //% block="C0"
        C0 = 0,
        //% block="C1"
        C1 = 1,
        //% block="C2"
        C2 = 2
    }

    // 引脚模式枚举
    export enum PinMode {
        //% block="模拟输入"
        ADC = 0,
        //% block="DHT11"
        DHT11 = 1,
        //% block="DHT22"
        DHT22 = 2,
        //% block="DS18B20"
        DS18B20 = 3,
        //% block="数字输出"
        WriteGpio = 4,
        //% block="数字输入"
        ReadGpio = 5
    }

    //% block="set pin %pin mode %mode"
    //% weight=96
    export function setPinMode(pin: PinNumber, mode: PinMode): void {
        let buf = pins.createBuffer(2);
        buf[0] = 0x2c+pin;  // 设置引脚模式的命令
        buf[1] = mode;
        i2cWriteWithRetry(I2CADDR, buf);
        // 等待引脚初始化
        basic.pause(10);
    }

    //% block="set pin %pin gpio state %value"
    //% weight=95
    export function setGpioState(pin: PinNumber, value: boolean): void {
        let buf = pins.createBuffer(2);
        buf[0] = 0x39+pin;  // 设置GPIO状态的命令
        buf[1] = value ? 1 : 0;
        i2cWriteWithRetry(I2CADDR, buf);
    }

    
    // 传感器类型枚举
    export enum SensorType {
        //% block="模拟值"
        Analog = 0,
        //% block="数字值"
        Digital = 1,
        //% block="温度"
        DHT11Temperature = 2,
        //% block="湿度"
        DHT11Humidity = 3,
        //% block="温度"
        DHT22Temperature = 4,
        //% block="湿度"
        DHT22Humidity = 5,
        //% block="温度"
        DS18B20Temperature = 6,
    }

    //% block="read %type from pin %pin"
    //% weight=87
    export function readSensor(pin: PinNumber, type: SensorType): number {
        const DATA_ENABLE = 0x01;
        const MODE_ERROR = 0x02;
        const RETRY_COUNT = 3;

        switch (type) {
            case SensorType.Analog:
                // ADC读取
                let adcBuf = i2cReadWithRetry(I2CADDR, 0x45 + pin * 3, 3);
                if (adcBuf && adcBuf[0] == DATA_ENABLE) {
                    let adcValue = (adcBuf[1] << 8) | adcBuf[2];
                    if (adcValue > 3900) {
                        adcValue = 4095;
                    } else if (adcValue < 40) {
                        adcValue = 0;
                    }
                    return adcValue;
                }
                return 0xFFFF;

            case SensorType.Digital:
                // GPIO读取
                let gpioBuf = i2cReadWithRetry(I2CADDR, 0x3f + pin, 1);
                return gpioBuf ? gpioBuf[0] : 0xFF;

            case SensorType.DHT11Temperature:
                // DHT11温度读取
                let enableBuf = pins.createBuffer(2);
                enableBuf[0] = 0x57 + pin * 5;
                enableBuf[1] = DATA_ENABLE;
                i2cWriteWithRetry(I2CADDR, enableBuf);
                basic.pause(30);
                let dht11TempBuf = i2cReadWithRetry(I2CADDR, 0x57 + pin * 5, 3);
                if (dht11TempBuf && dht11TempBuf[0] == DATA_ENABLE) {
                    let sign = 1.0;
                    if (dht11TempBuf[1] & 0x80) {
                        dht11TempBuf[1] &= 0x7f;
                        sign = -1.0;
                    }
                    return (dht11TempBuf[1] + dht11TempBuf[2] * 0.01) * sign;
                }
                return 0;

            case SensorType.DHT11Humidity:
                // DHT11湿度读取
                enableBuf = pins.createBuffer(2);
                enableBuf[0] = 0x57 + pin * 5;
                enableBuf[1] = DATA_ENABLE;
                i2cWriteWithRetry(I2CADDR, enableBuf);
                basic.pause(30);
                let dht11HumBuf = i2cReadWithRetry(I2CADDR, 0x57 + pin * 5, 3);
                if (dht11HumBuf && dht11HumBuf[0] == DATA_ENABLE) {
                    return dht11HumBuf[1] + dht11HumBuf[2] * 0.01;
                }
                return 0;

            case SensorType.DHT22Temperature:
                // DHT22温度读取
                enableBuf = pins.createBuffer(2);
                enableBuf[0] = 0x57 + pin * 5;
                enableBuf[1] = DATA_ENABLE;
                i2cWriteWithRetry(I2CADDR, enableBuf);
                basic.pause(30);
                let dht22TempBuf = i2cReadWithRetry(I2CADDR, 0x57 + pin * 5, 3);
                if (dht22TempBuf && dht22TempBuf[0] == DATA_ENABLE) {
                    let sign = 1.0;
                    if (dht22TempBuf[1] & 0x80) {
                        dht22TempBuf[1] &= 0x7f;
                        sign = -1.0;
                    }
                    return (dht22TempBuf[1] + dht22TempBuf[2] * 0.01) * sign;
                }
                return 0;

            case SensorType.DHT22Humidity:
                // DHT22湿度读取
                enableBuf = pins.createBuffer(2);
                enableBuf[0] = 0x57 + pin * 5;
                enableBuf[1] = DATA_ENABLE;
                i2cWriteWithRetry(I2CADDR, enableBuf);
                basic.pause(30);
                let dht22HumBuf = i2cReadWithRetry(I2CADDR, 0x57 + pin * 5, 3);
                if (dht22HumBuf && dht22HumBuf[0] == DATA_ENABLE) {
                    return dht22HumBuf[1] + dht22HumBuf[2] * 0.01;
                }
                return 0;

            case SensorType.DS18B20Temperature:
                // DS18B20读取
                enableBuf = pins.createBuffer(2);
                enableBuf[0] = 0x75 + pin * 3;
                enableBuf[1] = DATA_ENABLE;
                i2cWriteWithRetry(I2CADDR, enableBuf);
                basic.pause(100);
                let ds18b20Buf = i2cReadWithRetry(I2CADDR, 0x75 + pin * 3, 3);
                if (ds18b20Buf && ds18b20Buf[0] == DATA_ENABLE) {
                    if (ds18b20Buf[1] == 0xff && ds18b20Buf[2] == 0xff) {
                        return 0.0;
                    }
                    let sign = 1.0;
                    if (ds18b20Buf[1] & 0x80) {
                        ds18b20Buf[1] &= 0x7f;
                        sign = -1.0;
                    }
                    return ((ds18b20Buf[1] * 256 + ds18b20Buf[2]) / 16.0) * sign;
                }
                return 0.0;

            default:
                return 0;
        }
    }


    export function setMotorPWMPeriod(): void {
        let buf = pins.createBuffer(5);
        buf[0] = 0x00;
        buf[1] = 0x00;
        buf[2] = 0xFF;
        buf[3] = 0x00;
        buf[4] = 0xFF;
        i2cWriteWithRetry(I2CADDR, buf);
    }

    
    // 360度舵机方向枚举
    export enum Servo360Direction {
        //% block="停止"
        Stop = 0,
        //% block="正转"
        Forward = 1,
        //% block="反转"
        Backward = 2
    }

    //% block="set 360 servo %servo direction %direction speed %speed"
    //% weight=85
    //% speed.min=0 speed.max=100
    export function setServo360(servo: Servos, direction: Servo360Direction, speed: number): void {
        // 限制速度范围在0-100之间
        speed = Math.max(0, Math.min(100, speed));
        
        let period = 1500;  // 默认停止值
        
        if (speed > 0) {
            switch (direction) {
                case Servo360Direction.Forward:
                    // 1450 - (speed * 4.5) 范围：1500 ~ 1000
                    period = Math.round(1450 - (speed * 4.5));
                    break;
                case Servo360Direction.Backward:
                    // 1550 + (speed * 4.5) 范围：1550 ~ 2000
                    period = Math.round(1550 + (speed * 4.5));
                    break;
                case Servo360Direction.Stop:
                default:
                    period = 1500;
                    break;
            }
        }

        let buf = pins.createBuffer(3);
        buf[0] = 0x18 + servo * 2;  // I2C_SERVO0_DUTY_H + number*2
        buf[1] = (period >> 8) & 0xFF;
        buf[2] = period & 0xFF;
        i2cWriteWithRetry(I2CADDR, buf);
    }
}