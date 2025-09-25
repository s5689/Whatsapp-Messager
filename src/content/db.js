export const modalState = {
  _appointment: false,
  _appointmentCallbacks: [],

  get appointment() {
    return this._appointment;
  },

  set appointment(e) {
    this._appointment = e;
    this._appointmentCallbacks.forEach((value) => {
      value(e);
    });
  },

  onAppointmentChange(e) {
    this._appointmentCallbacks.push(e);
  },

  /*
  disconnectAppointmentListener(e) {
    const foundCallback = this._appointmentCallbacks.findIndex((value) => value === e);

    if (foundCallback !== -1) {
      this._appointmentCallbacks = this._appointmentCallbacks.filter((value) => value !== e);
    }
  },
  */

  _register: false,
  _registerCallbacks: [],

  get register() {
    return this.register;
  },

  set register(e) {
    this._register = e;
    this._registerCallbacks.forEach((value) => {
      value(e);
    });
  },

  onRegisterChange(e) {
    this._registerCallbacks.push(e);
  },

  _extraData: false,
  _extraDataCallbacks: [],
  extraDataSystemTrigger: false,

  get extraData() {
    return this._extraData;
  },

  set extraData(e) {
    this._extraData = e;

    if (this.extraDataSystemTrigger) {
      this._extraDataCallbacks.forEach((value) => {
        value(e);
      });
    }
  },

  onExtraDataChange(e) {
    this._extraDataCallbacks.push(e);
  },
};
