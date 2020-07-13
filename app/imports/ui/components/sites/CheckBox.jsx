import React from 'react';
import PropTypes from 'prop-types';



const Checkbox = React.forwardRef(({ type = 'checkbox', name, checked = false, onChange }, ref) => (
  <input ref={ref} type={type} name={name} checked={checked} onChange={onChange} />
));

Checkbox.propTypes = {
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
}

export default Checkbox;