var Service, Characteristic;
var request = require("request");

module.exports = function(homebridge){
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-nexia-thermostat", "NexiaThermostat", NexiaThermostat);
};


function NexiaThermostat(log, config) {
	this.log = log;
  this.name = config.name;
  this.apiroute = config.apiroute;
  this.houseId = config.houseId;
  this.thermostatIndex = config.thermostatIndex;
  this.xMobileId = config.xMobileId;
	this.xApiKey = config.xApiKey;
  this.manufacturer = config.manufacturer;
  this.model = config.model;
  this.serialNumber = config.serialNumber;
	this.service = new Service.Thermostat(this.name);
}

NexiaThermostat.prototype = {
	//Start
	identify: function(callback) {
		this.log("Identify requested!");
		callback(null);
	},
	// Required
	getCurrentHeatingCoolingState: function(callback) {
    var requestUrl = this.apiroute + "houses/" + this.houseId;
		this.log("getCurrentHeatingCoolingState from: %s", requestUrl);
		request.get({
			url: requestUrl,
			headers: {"Content-Type": "application/json", "X-MobileId": this.xMobileId, "X-ApiKey": this.xApiKey}
		}, function(err, response, body) {
      this.log("Request made to: %s", requestUrl);
			if (!err && response.statusCode == 200) {
				this.log("response success");
        var data = JSON.parse(body);
        var rawState = data.result._links.child[0].data.items[this.thermostatIndex].zones[0].current_zone_mode;
        var characteristic = Characteristic.CurrentHeatingCoolingState.OFF;
        if (rawState === "COOL") {
          characteristic = Characteristic.CurrentHeatingCoolingState.COOL;
        } else if (rawState === "HEAT") {
          characteristic = Characteristic.CurrentHeatingCoolingState.HEAT;
        } else if (rawState === "AUTO") {
          characteristic = Characteristic.CurrentHeatingCoolingState.AUTO;
        }
        return callback(null, characteristic);
			} else {
				this.log("Error getting CurrentHeatingCoolingState response.statusCode: %s", response.statusCode);
				callback(err);
			}
		}.bind(this));
	},
	getTargetHeatingCoolingState: function(callback) {
		this.log("getTargetHeatingCoolingState");
		request.get({
			url: this.apiroute + "houses/" + this.houseId,
      headers: {"Content-Type": "application/json", "X-MobileId": this.xMobileId, "X-ApiKey": this.xApiKey}
		}, function(err, response, body) {
			if (!err && response.statusCode == 200) {
				this.log("response success");
				var data = JSON.parse(body);
        var rawState = data.result._links.child[0].data.items[this.thermostatIndex].zones[0].current_zone_mode;

        var characteristic = Characteristic.TargetHeatingCoolingState.OFF;
        if (rawState === "COOL") {
          characteristic = Characteristic.TargetHeatingCoolingState.COOL;
        } else if (rawState === "HEAT") {
          characteristic = Characteristic.TargetHeatingCoolingState.HEAT;
        } else if (rawState === "AUTO") {
          characteristic = Characteristic.TargetHeatingCoolingState.AUTO;
        }
        return callback(null, characteristic);
			} else {
				this.log("Error getting TargetHeatingCoolingState: %s", err);
				callback(err);
			}
		}.bind(this));
	},
	setTargetHeatingCoolingState: function(value, callback) {
		if(value === undefined) {
			callback(); //Some stuff call this without value doing shit with the rest
		} else {
			callback(null);
		}
	},
	getCurrentTemperature: function(callback) {
		this.log("getCurrentTemperature");
		request.get({
      url: this.apiroute + "houses/" + this.houseId,
      headers: {"Content-Type": "application/json", "X-MobileId": this.xMobileId, "X-ApiKey": this.xApiKey}
		}, function(err, response, body) {
			if (!err && response.statusCode == 200) {
				this.log("response success");
				var data = JSON.parse(body);
        var f = data.result._links.child[0].data.items[this.thermostatIndex].zones[0].temperature;
        var c = (f-32.0) / 1.8;
        callback(null, c);
			} else {
				this.log("Error getCurrentTemperature: %s", err);
				callback(err);
			}
		}.bind(this));
	},
	getTargetTemperature: function(callback) {
		this.log("getTargetTemperature");
		request.get({
      url: this.apiroute + "houses/" + this.houseId,
      headers: {"Content-Type": "application/json", "X-MobileId": this.xMobileId, "X-ApiKey": this.xApiKey}
		}, function(err, response, body) {
			if (!err && response.statusCode == 200) {
				this.log("response success");
				var data = JSON.parse(body);
        var systemStatus = data.result._links.child[0].data.items[this.thermostatIndex].system_status;
        var f = data.result._links.child[0].data.items[this.thermostatIndex].zones[0].temperature;
        if(systemStatus === "Cooling") {
          f = data.result._links.child[0].data.items[this.thermostatIndex].zones[0].setpoints.cool;
        }
        if(systemStatus === "Heating") {
          f = data.result._links.child[0].data.items[this.thermostatIndex].zones[0].setpoints.heat;
        }
        var c = (f-32.0) / 1.8;
        callback(null, c);
			} else {
				this.log("Error getTargetTemperature: %s", err);
				callback(err);
			}
		}.bind(this));
	},
  setTargetTemperature: function(value, callback) {
    callback(null);
  },
	getTemperatureDisplayUnits: function(callback) {
		var error = null;
    callback(null, Characteristic.TemperatureDisplayUnits.FAHRENHEIT);
	},
	setTemperatureDisplayUnits: function(value, callback) {
		callback(null);
	},

	// Optional
	getCoolingThresholdTemperature: function(callback) {
    this.log("getCoolingThresholdTemperature");
		request.get({
      url: this.apiroute + "houses/" + this.houseId,
      headers: {"Content-Type": "application/json", "X-MobileId": this.xMobileId, "X-ApiKey": this.xApiKey}
		}, function(err, response, body) {
			if (!err && response.statusCode == 200) {
				this.log("response success");
				var data = JSON.parse(body);
        var currentCool = data.result._links.child[0].data.items[this.thermostatIndex].zones[0].setpoints.cool;
        var currentCoolC = (currentCool-32.0) / 1.8;
        callback(null,  currentCoolC);
			} else {
				this.log("Error getCoolingThresholdTemperature: %s", err);
				callback(err);
			}
		}.bind(this));
	},
  setCoolingThresholdTemperature: function(value, callback) {
    this.log("setCoolingThresholdTemperature to " + value);
    callback(null);
    request.get({
        url: this.apiroute + "houses/" + this.houseId,
        headers: {"Content-Type": "application/json", "X-MobileId": this.xMobileId, "X-ApiKey": this.xApiKey}
  		}, function(err, response, body) {
  			if (!err && response.statusCode == 200) {
  				var data = JSON.parse(body);
          var currentHeatSetPoint = data.result._links.child[0].data.items[this.thermostatIndex].zones[0].setpoints.heat;
          coolSetPoint = value * 1.8000 + 32.00;
          var postUrl = data.result._links.child[0].data.items[this.thermostatIndex].features[0].actions.set_heat_setpoint.href;
          this.setSetPoints(postUrl, currentHeatSetPoint, coolSetPoint, callback);
  			} else {
  				this.log("Error setCoolingThresholdTemperature: %s", err);
  				callback(err);
  			}
  		}.bind(this));
  },
	getHeatingThresholdTemperature: function(callback) {
    this.log("getHeatingThresholdTemperature");
		request.get({
      url: this.apiroute + "houses/" + this.houseId,
      headers: {"Content-Type": "application/json", "X-MobileId": this.xMobileId, "X-ApiKey": this.xApiKey}
		}, function(err, response, body) {
			if (!err && response.statusCode == 200) {
				this.log("response success");
				var data = JSON.parse(body);
        var currentHeat = data.result._links.child[0].data.items[this.thermostatIndex].zones[0].setpoints.heat;
        var currentHeatC = (currentHeat-32.0) / 1.8;
        callback(null, currentHeatC);
			} else {
				this.log("Error getHeatingThresholdTemperature: %s", err);
				callback(err);
			}
		}.bind(this));
	},
  setHeatingThresholdTemperature: function(value, callback) {
    this.log("setHeatingThresholdTemperature to " + value);
    callback(null);
    request.get({
        url: this.apiroute + "houses/" + this.houseId,
        headers: {"Content-Type": "application/json", "X-MobileId": this.xMobileId, "X-ApiKey": this.xApiKey}
  		}, function(err, response, body) {
  			if (!err && response.statusCode == 200) {
  				var data = JSON.parse(body);
          var currentCoolSetPoint = data.result._links.child[0].data.items[this.thermostatIndex].zones[0].setpoints.cool;
          heatSetPoint = value * 1.8000 + 32.00;
          var postUrl = data.result._links.child[0].data.items[this.thermostatIndex].features[0].actions.set_heat_setpoint.href;
          this.setSetPoints(postUrl, heatSetPoint, currentCoolSetPoint, callback);
  			} else {
  				this.log("Error setHeatingThresholdTemperature: %s", err);
  				callback(err);
  			}
  		}.bind(this));
  },
  setSetPoints: function(postUrl, heatSetPoint, coolSetPoint, callback) {
    this.log("Setting to heat: " + heatSetPoint + ", cool: " + coolSetPoint);
    var options = {
      uri: postUrl,
      method: 'POST',
      headers: {"Content-Type": "application/json", "X-MobileId": this.xMobileId, "X-ApiKey": this.xApiKey},
      json: {
        "heat": heatSetPoint,
        "cool": coolSetPoint
      }
    };
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        callback(null);
      } else {
        callback(error);
      }
    });
  },
	getName: function(callback) {
		this.log("getName :", this.name);
		var error = null;
		callback(error, this.name);
	},

	getServices: function() {

		// you can OPTIONALLY create an information service if you wish to override
		// the default values for things like serial number, model, etc.
		var informationService = new Service.AccessoryInformation();

		informationService
			.setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
			.setCharacteristic(Characteristic.Model, this.model)
			.setCharacteristic(Characteristic.SerialNumber, this.serialNumber);



		// Required Characteristics
		this.service
			.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
			.on('get', this.getCurrentHeatingCoolingState.bind(this));

		this.service
			.getCharacteristic(Characteristic.TargetHeatingCoolingState)
			.on('get', this.getTargetHeatingCoolingState.bind(this))
			.on('set', this.setTargetHeatingCoolingState.bind(this));

		this.service
			.getCharacteristic(Characteristic.CurrentTemperature)
			.on('get', this.getCurrentTemperature.bind(this));

		this.service
			.getCharacteristic(Characteristic.TargetTemperature)
			.on('get', this.getTargetTemperature.bind(this))
			.on('set', this.setTargetTemperature.bind(this));

		this.service
			.getCharacteristic(Characteristic.TemperatureDisplayUnits)
			.on('get', this.getTemperatureDisplayUnits.bind(this))
			.on('set', this.setTemperatureDisplayUnits.bind(this));

		// Optional Characteristics
		this.service
			.getCharacteristic(Characteristic.CoolingThresholdTemperature)
			.on('get', this.getCoolingThresholdTemperature.bind(this))
      .on('set', this.setCoolingThresholdTemperature.bind(this));


		this.service
			.getCharacteristic(Characteristic.HeatingThresholdTemperature)
			.on('get', this.getHeatingThresholdTemperature.bind(this))
      .on('set', this.setHeatingThresholdTemperature.bind(this));

		this.service
			.getCharacteristic(Characteristic.Name)
			.on('get', this.getName.bind(this));
		return [informationService, this.service];
	}
};
