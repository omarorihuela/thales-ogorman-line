/*
    ** This program has the obect structure
    for the cobotUR10. This object save all 
    the infomation that is going to be used 
    and showed on the Interface **
*/
module.exports = function Cobot (id) {
    this.id = id;
    this.statusModbusPLC = false;
    this.machineBefore = 'Metronic';
    this.machineAfterRight = 'ICI01';
    this.machineAfterLeft = 'ICI02';
    this.bandMetronic = {
        start: false,
        pause: false, 
        reset: false
    }
    this.modbusCobot = {
        status: false,
        protectiveStop: false,
        emergencyStop: false
    };
    this.production = {
        status : {
            robot: 'Desconectado',  // String -> Running || Pause 
            safety: false,          // Bool -> true : OK || false : NO OK
            metronic: false,        // Bool -> true : RUN || false : STOP
            ICI01: null,            // Bool -> true : RUN || false : STOP
            ICI02: null             // Bool -> true : RUN || false : STOP
        },
        cardsCounters : {
            takenFromMetronic: '0',     // Number
            droppedOnICI01: '0',        // Number
            droppedOnICI02: '0',        // Number
            cardsRejected: '0',         // Number
            resetLotCardsCounters: '0', // Boolean -> (1 : True) || (0 : False)
            cardsContainer: {
                inputA: '0',        // Number
                inputB: '0'         // Number
            }
        },
        cobotBuffer : {
            bufferCards: '0',       // Number                   
            drawersOccuped: {
                formatA: '0',
                formatB: '119'
            },
            resetBuffer: '0'        // Boolean -> (1 : True) || (0 : False)
        }
    };
    this.control = {
        general : {
            setPointCards: '50',    // Number
            changeFormat: '0'       // Boolean -> (1 : True) || (0 : False)
        }, 
        process : {
            stateMetronic: '1',     // Boolean -> (1 : True) || (0 : False)
            stateBuffer: '1',       // Boolean -> (1 : True) || (0 : False)
            stateICI01: '1',       // Boolean -> (1 : True) || (0 : False)
            stateICI02: '1',       // Boolean -> (1 : True) || (0 : False)
            openGripper: '0',       // Boolean -> (1 : True) || (0 : False)
            generalReset: '0'       // Boolean -> (1 : True) || (0 : False)
        }
    };
    this.monitoring = {
        inputs: {
            I0_00: false,   //Start Button
            I0_01: false,   //Pause Button  
            I0_02: false,   //Reset Button
            I0_03: false,   //Status safety relay
            I0_04: false,   //Thermostat
            I0_05: false,   //Pressure switch
            I0_06: false,   //Sensor on Metronic Box 02
            I0_07: false,   //Counter sensor on Metronic
            I0_08: false,   //Sensor on Metronic Box 01
            I0_09: false,   //Level Up sensor on ICI01
            I0_10: false,   //Level Up sensor on ICI02
            I0_11: false,   //Gripper (Comes from Cobot)
            I0_12: false,   //Band failure
            I0_13: false,   //Cards taken from Metronic (Comes from Cobot)
            I0_14: false,   //Metronic state (Run / Stop)
            I0_15: false,   //Top face card counter sensor
            I0_16: false,   //Bottom face card counter sensor
            I0_17: false    //Reject card sensor

        },
        outputs: {
            O1_00: false,   //Cards availables on PickPoint 01
            O1_01: false,   //Cards availables on PickPoint 02
            O1_02: false,   //Drop cards on ICI01
            O1_03: false,   //Drop cards on ICI02
            O1_04: false,   //Green light
            O1_05: false,   //Yellow light
            O1_06: false,   //Red light
            O1_07: false,   //Start UR10
            O1_08: false,   //PauseUR10
            O1_09: false,   //Gripper
            O1_10: false,   //Gripper feedback to cobotUR10
            O1_11: false,   //Start band
            O2_00: false,   //Stop band
            O2_01: false,   //Reset band
            O2_02: false,   //Move piston
            O2_03: false,   //Move piston 01
            O2_04: false,   //Move piston 02
            O2_05: false,   //Start PowerFlex
            O2_06: false,   //PAuse PowerFlex
            O2_07: false    //Reset PowerFlex
        }
    };
}

