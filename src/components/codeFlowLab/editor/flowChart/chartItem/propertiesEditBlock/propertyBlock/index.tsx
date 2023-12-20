import OptionSelector from '@/components/common/optionSelector';
import { SCROLL_CLASS_PREFIX } from '@/consts/codeFlowLab/items';
import classNames from 'classnames/bind';
import _ from 'lodash';
import { KeyboardEventHandler, useCallback } from 'react';
import styles from './propertyBlock.module.scss';
const cx = classNames.bind(styles);
//

type SelectOption = { value: any; label: string; isDisabled?: boolean };

interface Props {
  id: string;
  propertyKey: string;
  value: number | string;
  onChangeValue: (_key: string, _value: number | string) => void;
  propertyKeyList?: {
    options: SelectOption[];
    onChangeKey: (_beforeKey: string, _key: string) => void;
  };
  valueList?: SelectOption[];
  onDelete?: (_key: string) => void;
}
function PropertyBlock({ id, propertyKey, value, propertyKeyList, valueList, onChangeValue, onDelete }: Props) {
  const handleChangeKey = (_afterKey) => {
    propertyKeyList.onChangeKey(propertyKey, _afterKey);
  };

  const changeValue = (_val: string | number) => {
    onChangeValue(propertyKey, _val);
  };

  const parseValue = (_val) => (_.isNumber(value) ? parseFloat(_val) : _val);

  const handleOnChange = useCallback(
    _.debounce((_event) => {
      const _val = parseValue(_event.target.value);

      changeValue(_val);
    }, 800),
    []
  );

  const handleEnter: KeyboardEventHandler<HTMLInputElement> = (_event) => {
    if (_event.key === 'Enter') {
      handleOnChange.cancel();

      const _val = parseValue((_event.target as HTMLInputElement).value);

      changeValue(_val);
    }
  };

  return (
    <div className={cx('property-block')}>
      {onDelete && (
        <button className={cx('delete-button')} onClick={() => onDelete(propertyKey)}>
          <i className="material-symbols-outlined">close</i>
        </button>
      )}
      <div className={cx('property-header')}>
        {propertyKeyList ? (
          <OptionSelector
            optionList={propertyKeyList.options}
            defaultValue={propertyKey}
            isSearchable
            onChange={handleChangeKey}
          />
        ) : (
          <p>{propertyKey}</p>
        )}
      </div>
      {valueList ? (
        <OptionSelector
          optionList={valueList}
          defaultValue={value}
          isSearchable
          onChange={(_val) => changeValue(_val)}
        />
      ) : (
        <input
          className={cx('value-input', SCROLL_CLASS_PREFIX)}
          defaultValue={value}
          onChange={handleOnChange}
          type={typeof value}
          onKeyPress={handleEnter}
        />
      )}
    </div>
  );
}

export default PropertyBlock;
