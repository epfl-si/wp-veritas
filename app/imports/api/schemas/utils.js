function isRequired() {
  if (this.value === '') {
      return "required";
  }
}

function isRequiredUnderCondition() {    
  if (this.obj.type != 'field-of-research' && this.value === '') {
      return "required";
  }
}

export {
  isRequired,
  isRequiredUnderCondition,
}