
/*
    ** This program has the obect structure
    for the scaraJM01 and scaraJM02. This 
    object save all the infomation that is 
    going to be used and showed on the 
    Interface **
*/
module.exports = function ScaraJM (id) {
    this.id = id;                       //The id is the name of the SCARA
    this.statusModbusPLC = false;
    this.machineBefore = 'Jinguan';
    this.machineAfter = 'MPR';
    this.production = {
        status : {
            robot: 'Desconectado',  // String -> Trabajando || Pause
            safety: false,          // Bool -> true : OK || false : NO OK
            Jinguan: false,         // Bool -> true : RUN || false : STOP
            MPR: false              // Bool -> true : RUN || false : STOP
        },
        cardsCounters : {
            takenFromJinguan: '0',  // Number
            droppedOnMPR: '0',      // Number
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
            stateJinguan: '1',      // Boolean -> (1 : True) || (0 : False)
            stateBuffer: '1',       // Boolean -> (1 : True) || (0 : False)
            stateMPR: '1',          // Boolean -> (1 : True) || (0 : False)
            takeCards: '0',         // Boolean -> (1 : True) || (0 : False)
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
            I0_06: false,   //Lower lever sensor on Jinguan
            I0_07: false,   //Lower level sensor on MPR
            I0_08: false,   //Upper level sensor on MPR
            I0_09: false,   //Gripper
            I0_10: false,   //Cards taken from Jinguan
            I0_11: false,   //Jinguan (Run / Stop)
            I0_12: false,   //MPR (Run / Stop)
            I0_13: false,   //Counter input cards sensor Jinguan 
            I0_14: false,   //Counter output cards sensor Jinguan 
            I0_15: false,   //Cards rejected sensor
            I0_16: false,   //Counter input cards sensor MPR
            I0_17: false,   ////Counter output cards sensor MPR
            I0_18: false,   //Scara ready
            I0_19: false    //Scara error
        },
        outputs: {
            O1_00: false,   //Cards pre-availables on PickPoint Jinguan
            O1_01: false,   //Take cards on PickPoint Jinguan
            O1_02: false,   //Drop cards on DropPoint MPR
            O1_03: false,   //Green light
            O1_04: false,   //Yellow light
            O1_05: false,   //Red light
            O1_06: false,   //Start Scara
            O1_07: false,   //Continue Scara
            O1_08: false,   //Pause Scara
            O1_09: false,   //Reset Scara
            O1_10: false,   //Gripper
            O1_11: false,   //Gripper feddback (Send to Scara)
            O2_00: false,   //Start Jinguan
            O2_01: false    //Pause Jinguan
        }

    }
}
/* <------------------------------------------- */