import { getBlockType, makeNewItem } from '@/components/codeFlowLab/editor/flowChart/utils';
import { ZOOM_AREA_ELEMENT_ID } from '@/consts/codeFlowLab/items';
import { ChartItemType } from '@/consts/types/codeFlowLab';
import { RootState } from '@/reducers';
import { Operation, setDocumentValueAction } from '@/reducers/contentWizard/mainDocument';
import { getChartItem, getSceneId } from '@/utils/content';
import { useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import classNames from 'classnames/bind';
import styles from './panelItem.module.scss';
const cx = classNames.bind(styles);

interface Props {
  itemType: ChartItemType;
}
function PanelItem({ itemType }: Props) {
  const dispatch = useDispatch();

  const { chartItems, itemsPos, selectedSceneId, sceneItemIds } = useSelector((state: RootState) => {
    const selectedSceneId = getSceneId(state.contentDocument.scene, state.sceneOrder);

    return {
      chartItems: state.contentDocument.items,
      itemsPos: state.contentDocument.itemsPos,
      selectedSceneId,
      sceneItemIds: state.contentDocument.scene[selectedSceneId]?.itemIds || [],
    };
  }, shallowEqual);

  const selectedChartItem = useMemo(() => getChartItem(sceneItemIds, chartItems), [chartItems, sceneItemIds]);

  const itemDesc = {
    [ChartItemType.div]: '엘리먼트의 그룹을 만들기 위한 단위 입니다.',
    [ChartItemType.paragraph]: '텍스트를 입력하기 위한 플로우 박스 입니다.',
    [ChartItemType.span]: '텍스트를 입력하는 가장 작은 단위 입니다.',
    [ChartItemType.button]: '스크립트 기능을 실행하기 위한 플로우 박스 입니다.',
    [ChartItemType.image]: '이미지를 불러올 수 있는 플로우 박스 입니다.',
    [ChartItemType.function]: '스크립트를 작성하기 위한 기본 단위입니다.',
    [ChartItemType.loop]: '연결된 Function 블럭을 지정된 횟수 만큼 반복 실행합니다.',
    [ChartItemType.console]: '변수와 함수의 실행 여부 확인을 위해 디버깅 용도로 사용됩니다.',
    [ChartItemType.variable]: '페이지 또는 프로젝트에서 사용할 변수를 담아 놓은 박스 입니다.',
    [ChartItemType.array]: '페이지 또는 프로젝트에서 사용할 변수 리스트를 작성합니다.',
    [ChartItemType.if]: 'Condition 블럭과 조합하여 특정 함수를 실행하는 분기를 설정 합니다.',
    [ChartItemType.condition]: '변수 블럭과 조합하여 참/거짓을 반환합니다.',
    [ChartItemType.size]:
      '변수의 글자 또는 요소의 수를 반환합니다. 특정 문자를 입력 시, 변수 안에서 해당 글자의 갯수를 반환합니다.',
    [ChartItemType.includes]: '변수 블럭 내에 특정 글자가 있는지 확인하여 참/거짓을 반환합니다.',
    [ChartItemType.get]: '변수 블럭 내의 특정 인덱스에 해당하는 글자를 반환합니다.',
    [ChartItemType.indexOf]: '특정 문자가 변수 내에서 몇 번째 위치에 있는지 반환합니다.',
    [ChartItemType.changeValue]: '특정 변수의 값을 변경합니다.',
    [ChartItemType.addStyle]: '선택한 엘리먼트에 스타일을 더합니다.',
    [ChartItemType.removeStyle]: '선택한 엘리먼트에 스타일을 지웁니다.',
    [ChartItemType.toggleStyle]:
      '선택한 엘리먼트의 스타일을 더하거나 지웁니다.  만약 실행 시점에서 스타일에 누락이 있다면, 더하는 이벤트만 실행이 됩니다.',
    [ChartItemType.moveScene]:
      '원하는 장면의 다음 장면으로 화면을 전환합니다. 범위를 초과하는 값이 입력된 경우 첫 페이지 또는 마지막 페이지로 이동될 수 있습니다.',
    [ChartItemType.moveNextScene]: '현재 장면의 다음 장면으로 화면을 전환합니다. 마지막 장면인 경우 전환되지 않습니다.',
    [ChartItemType.movePrevScene]: '현재 장면의 전 장면으로 화면을 전환합니다. 첫 장면인 경우 전환되지 않습니다.',
    [ChartItemType.sceneOrder]: '현재 장면의 순서를 반환합니다.',
    [ChartItemType.link]: '기입된 링크의 페이지를 오픈합니다.',
    [ChartItemType.input]: '사용자가 기입할 수 있는 입력란을 제공합니다. variable블록의 값을 변경할 수 있습니다.',
  };

  const handleMakeItem = () => {
    const zoomArea = document.getElementById(ZOOM_AREA_ELEMENT_ID);

    const [newFlowItem, pos, newItemId] = makeNewItem(
      zoomArea,
      chartItems,
      selectedChartItem,
      itemsPos,
      itemType,
      selectedSceneId
    );

    const operations: Operation[] = [
      {
        key: 'items',
        value: {
          ...chartItems,
          [newItemId]: newFlowItem,
        },
      },
      {
        key: `itemsPos`,
        value: {
          ...itemsPos,
          [newItemId]: pos,
        },
      },
      {
        key: `scene.${selectedSceneId}.itemIds`,
        value: [...sceneItemIds, newItemId],
      },
    ];

    dispatch(setDocumentValueAction(operations));
  };

  return (
    <div className={cx('panel-item')} onClick={handleMakeItem}>
      <p className={cx('panel-title', getBlockType(itemType, true))}>
        <span>{itemType}</span>
      </p>
      <p className={cx('panel-desc')}>{itemDesc[itemType]}</p>
    </div>
  );
}

export default PanelItem;
