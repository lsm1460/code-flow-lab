import { SCROLL_CLASS_PREFIX } from '@/consts/codeFlowLab/items';
import { RootState } from '@/reducers';
import { SelectOption, resetOptionModalInfoAction } from '@/reducers/contentWizard/mainDocument';
import _ from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import classNames from 'classnames/bind';
import styles from './flowOptionModal.module.scss';
const cx = classNames.bind(styles);

const OPTION_LIST_MAX = 10;
const OPTION_HEIGHT = 35;

function FlowOptionModal() {
  const dispatch = useDispatch();

  const scrollAreaRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectContainerRef = useRef<HTMLDivElement>(null);

  const selectModal = useSelector((state: RootState) => state.selectModal);
  const isOpen = !!selectModal;

  const { optionList, isSearchable, defaultValue, onChange } = selectModal;

  const [searchValue, setSearchValue] = useState('');

  const filteredOptions = useMemo(
    () => optionList.filter((option) => `${option.label}`.toLowerCase().includes(searchValue.toLowerCase())),
    [optionList, searchValue]
  );

  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [optionTopIndex, setOptionTopIndex] = useState(0);

  useEffect(() => {
    if (isOpen && isSearchable) {
      searchInputRef.current?.focus();
    }
  }, [isOpen, isSearchable]);

  useEffect(() => {
    const handleKeydown = (_event) => {
      if (_event.key === 'Escape') {
        dispatch(resetOptionModalInfoAction());
      } else if (_event.key === 'ArrowDown') {
        setSelectedOptionIndex((_prev) => {
          const _nextIndex = _prev + 1 > filteredOptions.length - 1 ? 0 : _prev + 1;

          if (optionTopIndex + OPTION_LIST_MAX === _nextIndex) {
            scrollAreaRef.current.scroll(0, Math.max(0, _nextIndex - (OPTION_LIST_MAX - 1)) * OPTION_HEIGHT);

            setOptionTopIndex(Math.max(0, _nextIndex - (OPTION_LIST_MAX - 1)));
          } else if (_nextIndex === 0) {
            scrollAreaRef.current.scroll(0, 0);

            setOptionTopIndex(0);
          }

          return _nextIndex;
        });
      } else if (_event.key === 'ArrowUp') {
        setSelectedOptionIndex((_prev) => {
          const _prevIndex = _prev - 1 < 0 ? filteredOptions.length - 1 : _prev - 1;

          if (_prevIndex === filteredOptions.length - 1) {
            scrollAreaRef.current.scroll(0, filteredOptions.length * OPTION_HEIGHT);

            setOptionTopIndex(filteredOptions.length - OPTION_LIST_MAX);
          } else if (optionTopIndex === _prevIndex + 1) {
            scrollAreaRef.current.scroll(0, Math.max(0, _prevIndex) * OPTION_HEIGHT);

            setOptionTopIndex((_prev) => Math.max(0, _prevIndex));
          }

          return _prevIndex;
        });
      } else if (_event.key === 'Enter') {
        onChange(filteredOptions[selectedOptionIndex].value);

        dispatch(resetOptionModalInfoAction());
      }
    };

    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [selectedOptionIndex, optionTopIndex]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectContainerRef.current && !selectContainerRef.current.contains(event.target as Node)) {
        dispatch(resetOptionModalInfoAction());
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (option: SelectOption) => {
    onChange(option.value);

    dispatch(resetOptionModalInfoAction());
  };

  useEffect(() => {
    const targetIndex = _.findIndex(filteredOptions, (_opt) => _opt.value === defaultValue);

    setSelectedOptionIndex(targetIndex);

    scrollAreaRef.current.scroll(0, Math.max(0, targetIndex - (OPTION_LIST_MAX - 1)) * OPTION_HEIGHT);

    const topIndex = Math.max(0, targetIndex - (OPTION_LIST_MAX - 1));

    setOptionTopIndex(topIndex);
  }, [filteredOptions]);

  return (
    <div className={cx('options-modal-wrap', { [SCROLL_CLASS_PREFIX]: true })} ref={selectContainerRef}>
      {isSearchable && (
        <input
          ref={searchInputRef}
          className={cx('search-input', { [SCROLL_CLASS_PREFIX]: true })}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      )}
      <ul
        className={cx('options-container', { [SCROLL_CLASS_PREFIX]: true })}
        ref={scrollAreaRef}
        style={{
          maxHeight: OPTION_LIST_MAX * OPTION_HEIGHT,
        }}
      >
        {filteredOptions.map((option, _i) => (
          <li
            key={option.value}
            className={cx('option', { active: _i === selectedOptionIndex, [SCROLL_CLASS_PREFIX]: true })}
            onClick={() => handleOptionClick(option)}
            style={{
              height: OPTION_HEIGHT,
            }}
          >
            {option.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FlowOptionModal;
