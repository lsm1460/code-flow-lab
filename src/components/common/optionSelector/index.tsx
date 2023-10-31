import { SCROLL_CLASS_PREFIX } from '@/consts/codeFlowLab/items';
import { SelectModal, setOptionModalInfoAction } from '@/reducers/contentWizard/mainDocument';
import _ from 'lodash';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import classNames from 'classnames/bind';
import styles from './optionSelector.module.scss';
const cx = classNames.bind(styles);

export interface Props extends SelectModal {}
function OptionSelector(props: Props) {
  const dispatch = useDispatch();

  const { defaultValue, optionList } = props;

  const selectedOption = useMemo(
    () => _.find(optionList, (_opt) => _opt.value === defaultValue)?.label,
    [defaultValue, optionList]
  );

  const handleOpenSelectModal = () => {
    dispatch(setOptionModalInfoAction(props));
  };

  return (
    <div className={cx('select-container', SCROLL_CLASS_PREFIX)}>
      <div className={cx('selected-option', SCROLL_CLASS_PREFIX)} onClick={handleOpenSelectModal}>
        {selectedOption || '--선택하세요--'}
      </div>
    </div>
  );
}

export default OptionSelector;
