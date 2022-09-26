/* 
    ** This program has the object structure
    that is going to use for each machine:

    _Metronic, _ICI01, _Jinguan01, _MPR01,
    _ICI02, _Jinguan02, _MPR02. **

*/
module.exports = function Machine (name, idMachine, inputB) {   //This is a constructor.
    this.name = name;
    this.idMachine = idMachine;     //This idMachine is used to identify each machine on the database.
    this.cardsContainer = {         //This continer of the PickPoint: 0 to 50 cards.
        inputA: 0,
        inputB: 0
    };        
    this.status = {
        machine: false,
        relaySafety: false       
    };
    this.shiftCounter = {           //This property save all the counters cards on the actual working shift.
        inputA: 0,
        inputB: inputB,
        output: 0,
        rejected: 0
    };
    this.lotCounter = {             //This property save all the counter cards of one lot.
        inputA: 0,
        inputB: inputB,
        output: 0,
        rejected: 0
    };
    this.timeWorking = {
        machineOn: 0,
        machineOff: 0
    }
}