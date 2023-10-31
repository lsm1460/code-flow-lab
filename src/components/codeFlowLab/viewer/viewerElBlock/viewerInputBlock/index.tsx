import { ChartInputItem, TriggerProps, ViewerItem } from '@/consts/types/codeFlowLab';
import { setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import _ from 'lodash';
import { CSSProperties, ChangeEventHandler, RefObject, useCallback, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';

interface InputViewerItem extends ViewerItem {
  placeholder?: ChartInputItem['placeholder'];
  text?: ChartInputItem['text'];
}

interface Props {
  elRef: RefObject<HTMLInputElement>;
  viewerItem: InputViewerItem;
  triggerProps: TriggerProps;
  variables: {
    [x: string]: any;
  };
  addedStyle: CSSProperties;
}
function ViewerInputBlock({ elRef, viewerItem, triggerProps, variables, addedStyle }: Props) {
  const dispatch = useDispatch();

  const textVariable = useMemo(() => {
    const _var = variables[viewerItem.connectionVariables[0]?.connectParentId];

    return _.isUndefined(_var) ? viewerItem.text : _var;
  }, [variables, viewerItem]);

  const setVariable = useCallback(
    _.debounce((_text) => {
      dispatch(
        setDocumentValueAction({
          key: `items.${viewerItem.connectionVariables[0]?.connectParentId}.var`,
          value: _text,
          isSkip: true,
        })
      );
    }, 800),
    []
  );

  const handleOnChange: ChangeEventHandler<HTMLInputElement> = (_event) => {
    if (viewerItem.connectionVariables[0]) {
      setVariable(_event.target.value);
    }
  };

  useEffect(() => {
    (elRef.current as HTMLInputElement).value = textVariable;
  }, [textVariable]);

  return (
    <input
      ref={elRef}
      style={{ ...viewerItem.styles, ...addedStyle }}
      {...triggerProps}
      placeholder={viewerItem.placeholder}
      defaultValue={_.isUndefined(textVariable) ? viewerItem.text : textVariable}
      onChange={handleOnChange}
    />
  );
}

export default ViewerInputBlock;
