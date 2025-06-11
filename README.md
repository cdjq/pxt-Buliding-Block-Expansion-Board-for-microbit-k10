# Expansion Board MakeCode Extension

This MakeCode extension provides control functions for an I2C-based expansion board. It includes support for motor control, servo control, pin I/O modes, battery reading, and temperature/humidity sensors.

## Enumerations

### Motor Selection (`MyEnumMotor`)
- `M1`, `M2`, `M3`, `M4`: Select individual motors.
- `ALL`: Control all motors at once.

### Motor Direction (`MyEnumDir`)
- `Forward`
- `Backward`

### Servo Ports (`Servos`)
- `S1`, `S2`, `S3`, `S4`: Represents individual servo ports.

### General Purpose Enum (`MyEnum`)
- `One`, `Two`: Example placeholder enum.

### Pin Number (`PinNumber`)
- `C0`, `C1`, `C2`: Logical pin identifiers used for mode/state control.

### Pin Mode (`PinMode`)
- `ADC`: Analog input
- `DHT11`: DHT11 temperature/humidity sensor
- `DHT22`: DHT22 temperature/humidity sensor
- `DS18B20`: 1-wire temperature sensor
- `Digital OUT`: Output mode
- `Digital IN`: Input mode

### Pin State (`PinState`)
- `Low`
- `High`

### Sensor Type (`SensorType`)
- `Analog`
- `Digital`
- `DHT11Temperature`, `DHT11Humidity`
- `DHT22Temperature`, `DHT22Humidity`
- `DS18B20Temperature`

### 360-Degree Servo Direction (`Servo360Direction`)
- `Stop`
- `Forward`
- `Backward`

---

## Functions

### `initialize()`
Initializes the expansion board by sending an enable command and setting the motor PWM period.

### `readBattery(): number`
Reads the battery level as a percentage (0–255).

### `setPinMode(pin: PinNumber, mode: PinMode)`
Sets the function mode of the specified pin.

### `setGpioState(pin: PinNumber, value: PinState)`
Writes a digital state (`Low` or `High`) to a pin.

### `servoRun(servo: Servos, angle: number)`
Rotates a servo to a specified angle (0–180°). Automatically converts angle to PWM pulse width.

### `setServo360(servo: Servos, direction: Servo360Direction, speed: number)`
Controls a continuous rotation servo with speed (0–100) and direction.

### `controlMotor(emotor: MyEnumMotor, edir: MyEnumDir, speed: number)`
Controls DC motors:
- If a single motor (M1–M4) is selected, sends the direction and speed to it.
- If `ALL` is selected, configures all 4 motors at once.

---

## Internal Functions

> These are helper functions not exposed to the block interface but used internally.

- `i2cReadWithRetry(...)`: Handles I2C read with retries.
- `i2cWriteWithRetry(...)`: Handles I2C write with retries.
- `setMotorPWMPeriod()`: Sets the PWM period for motor control.
- `getVersion()`: Checks communication with the device using a version query.

---

## Notes

- This extension assumes the device's I2C address is `0x33`.
- Includes retry logic for robustness in I2C communication.
- Requires `basic.pause(...)` delays for proper hardware timing.

---

## Compatibility

Tested for:
- MakeCode for Micro:bit
- Expansion boards with I2C address `0x33`
- DHT11, DHT22, DS18B20 sensors
- SG90 and 360° servos
- 4-channel DC motor drivers

---

## License

MIT License
