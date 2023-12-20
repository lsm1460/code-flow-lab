import { SCROLL_CLASS_PREFIX } from '@/consts/codeFlowLab/items';
import { Operation, setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import classNames from 'classnames/bind';
import _ from 'lodash';
import { CSSProperties, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import PropertyBlock from '../propertyBlock';
import styles from './styleEditBlock.module.scss';
const cx = classNames.bind(styles);
//

const CSS_PROPERTIES = {
  display: ['block', 'inline', 'inline-block', 'flex'],
  color: '',
  fontSize: 10,
  textAlign: ['left', 'center', 'right'],
  padding: '0',
  paddingLeft: '0',
  paddingTop: '0',
  paddingRight: '0',
  paddingBottom: '0',
  margin: '0',
  marginLeft: '0',
  marginTop: '0',
  marginRight: '0',
  marginBottom: '0',
  background: '',
  backgroundColor: '',
  alignItems: ['baseline', 'center', 'flex-start', 'flex-end'],
  justifyContent: ['start', 'center', 'space-between', 'space-around', 'space-evenly'],
  letterSpacing: 0,
  cursor: ['help', 'wait', 'crosshair', 'not-allowed', 'zoom-in', 'zoom-out', 'grab', 'pointer'],
  filter: '',
  float: ['left', 'right', 'none', 'inline-start', 'inline-end'],
  overflow: ['visible', 'hidden', 'clip', 'scroll', 'auto'],
  overflowX: ['visible', 'hidden', 'clip', 'scroll', 'auto'],
  overflowY: ['visible', 'hidden', 'clip', 'scroll', 'auto'],
  position: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
  top: '0',
  left: '0',
  right: '0',
  bottom: '0',
  opacity: 1,
  aspectRatio: '1',
  zIndex: 0,
  width: '',
  minWidth: '',
  maxWidth: '',
  height: '',
  minHeight: '',
  maxHeight: '',
  userSelect: ['auto', 'none', 'all', 'text'],
  transform: '',
  lineHeight: '0',
  wordBreak: [
    'normal',
    'break-all',
    'keep-all',
    'break-word',

    /* Global values */
    'inherit',
    'initial',
    'revert',
    'revert-layer',
    'unset',
  ],
  border: '',
  textTransform: [
    'none',
    'capitalize',
    'uppercase',
    'lowercase',
    'full-width',
    'full-size-kana',
    /* Global values */
    'inherit',
    'initial',
    'revert',
    'revert-layer',
    'unset',
  ],
  borderRadius: '',
  fontWeight: ['100', '400', '500', '700'],
};
interface Props {
  id: string;
  styles: CSSProperties;
}
function StyleEditBlock({ id, styles }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();

  const cssPropertiesList = useMemo(
    () =>
      Object.keys(CSS_PROPERTIES).map((_cssKey) => ({
        value: _cssKey,
        label: _.kebabCase(_cssKey),
        isDisabled: Object.keys(styles).includes(_cssKey),
      })),
    [styles]
  );

  const getValueList = (_cssKey) => {
    if (!_.isArray(CSS_PROPERTIES[_cssKey])) {
      return;
    }

    return (CSS_PROPERTIES[_cssKey] as string[]).map((_cssVal, _index, _array) => ({
      value: _cssVal,
      label: _cssVal,
      isDisabled: !_array.includes(styles[_cssKey]),
    }));
  };

  const onChangeKey = (_beforeKey: string, _key: string) => {
    let value = _.pickBy(styles, (_val, _key) => _key !== _beforeKey);
    value = {
      ...value,
      [_key]: _.isArray(CSS_PROPERTIES[_key]) ? CSS_PROPERTIES[_key][0] : CSS_PROPERTIES[_key],
    };

    const operation: Operation = { key: `items.${id}.styles`, value };

    dispatch(setDocumentValueAction(operation));
  };

  const onChangeValue = (_key: string, value: string | number) => {
    const operation: Operation = { key: `items.${id}.styles.${_key}`, value };

    dispatch(setDocumentValueAction(operation));
  };

  const handleAddProperty = () => {
    let newProperty;

    for (let _cssKey in CSS_PROPERTIES) {
      if (!Object.keys(styles).includes(_cssKey)) {
        newProperty = _cssKey;
        break;
      }
    }

    if (!newProperty) {
      alert('더 이상 추가할 수 없습니다.');
      return;
    }

    const value = {
      ...styles,
      [newProperty]: _.isArray(CSS_PROPERTIES[newProperty])
        ? CSS_PROPERTIES[newProperty][0]
        : CSS_PROPERTIES[newProperty],
    };

    const operation: Operation = { key: `items.${id}.styles`, value };

    dispatch(setDocumentValueAction(operation));

    setTimeout(() => {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 10);
  };

  const onDelete = (_targetKey: string) => {
    let value = _.pickBy(styles, (_val, _key) => _key !== _targetKey);

    const operation: Operation = { key: `items.${id}.styles`, value };

    dispatch(setDocumentValueAction(operation));
  };

  return (
    <div>
      <div className={cx('property-list', { [SCROLL_CLASS_PREFIX]: true })} ref={scrollRef}>
        {Object.keys(styles).map((_cssKey) => (
          <PropertyBlock
            key={`${id}-${_cssKey}`}
            id={id}
            propertyKey={_cssKey}
            value={styles[_cssKey]}
            onChangeValue={onChangeValue}
            propertyKeyList={{
              options: cssPropertiesList,
              onChangeKey,
            }}
            {...(_.isArray(CSS_PROPERTIES[_cssKey]) && { valueList: getValueList(_cssKey) })}
            onDelete={onDelete}
          />
        ))}
      </div>

      <button className={cx('property-add-button')} onClick={handleAddProperty}>
        <i className="material-symbols-outlined">add</i>
      </button>
    </div>
  );
}

export default StyleEditBlock;
