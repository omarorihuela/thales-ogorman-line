
/*
    ** This program has the obect structure
    for the scaraIJ01 and scaraIJ02. This 
    object save all the infomation that is 
    going to be used and showed on the 
    Interface **
*/
module.exports = function ScaraIJ (id) {
    this.id = id;                       //The id is the name of the SCARA
    this.statusModbusPLC = false;
    this.machineBefore = 'ICI';
    this.machineAfter = 'Jinguan';
    this.production = {
        status : {
            robot: 'Desconectado',      // String -> Trabajando || Pause
            safety: false,              // Bool -> true : OK || false : NO OK
            ICI: false,                 // Bool -> true : RUN || false : STOP
            Jinguan: false              // Bool -> true : RUN || false : STOP
        },
        cardsCounters : {
            takenFromICI: '0',      // Number
            droppedOnJinguan: '0',  // Number
            cardsContainer: '0',    // Number
            cardsRejected: '0',     // Number
            resetCardsCounters: '0' // Boolean -> (1 : True) || (0 : False)
        },
        bufferScara: {
            bufferCards: '0',       // Number
            drawersOccuped: '0',    // Number
            resetBuffer: '0'        // Boolean -> (1 : True) || (0 : False)
        }
    };
    this.control = {
        general : {
            setPointCards: '50',    // Number  
            delayRobotUp: '5'      // Number
        },
        process : {
            stateICI: '1',         // Boolean -> (1 : True) || (0 : False)
            stateBuffer: '1',      // Boolean -> (1 : True) || (0 : False)
            stateJinguan: '1',     // Boolean -> (1 : True) || (0 : False)
            takeCards: '0',        // Boolean -> (1 : True) || (0 : False)
            openGripper: '0',      // Boolean -> (1 : True) || (0 : False)
            generalReset: '0'      // Boolean -> (1 : True) || (0 : False)
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
            I0_06: false,   //Lower lever sensor on ICI
            I0_07: false,   //Upper level sensor on Jinguan
            I0_08: false,   //Gripper
            I0_09: false,   //Cards taken from ICI (Comes form scaraIJ)
            I0_10: false,   //State ICI (Run / Stop)
            I0_11: false,   //Counter input cards sensor ICI
            I0_12: false,   //Counter output cards sensor ICI
            I0_13: false,   //Rejected cards sensor
            I0_14: false,   //Scara ready
            I0_15: false,   //Scara error
            I0_16: false    //Cards Rejected sensor Jinguan
        },
        outputs: {
            O1_00: false,   //Cards pre-availables on PickPoint ICI
            O1_01: false,   //Take cards on PickPoint ICI
            O1_02: false,   //Drop cards on DropPoint Jinguan
            O1_03: false,   //Green light
            O1_04: false,   //Yellow light
            O1_05: false,   //Red light
            O1_06: false,   //Start Scara
            O1_07: false,   //Continue Scara
            O1_08: false,   //Pause Scara
            O1_09: false,   //Reset Scara
            O1_10: false,   //Gripper
            O1_11: false,   //Gripper feddback (Send to Scara)
            O2_00: false,   //Start ICI
            O2_01: false,   //Pause ICI
        }

    }
}
/* <------------------------------------------- */