function bestCharge(selectedItems) {
  const orderList = covertToOrderList(selectedItems);
  return buildChargeHeader() + buildChargeItems(orderList) + buildChargePromotion(orderList) + buildChargeFooter(orderList);
}

function covertToOrderList(selectedItems){
  const items = loadAllItems();
  return selectedItems.map(i => {
    const id = i.slice(0,8);
    const count = i.slice(11);
    const item = items.find(item => item.id === id);
    return {...item, count};
  })
}

function buildChargeHeader(){
  return '============= 订餐明细 =============\n';
}

function buildChargeItems(orderList){
  return orderList.reduce((acc, current) => {
    acc += `${current.name} x ${current.count} = ${current.count * current.price}元\n`
    return acc;
  },'');
}

function buildChargePromotion(orderList){
  const promotion = chooseTheBestPromotion(orderList);
  if(promotion.type === 'origin'){
    return '';
  }

  return `-----------------------------------
使用优惠:
${buildDescribeForPromotion(promotion.type, orderList)}
`
}

function buildChargeFooter(orderList){
  const promotion = chooseTheBestPromotion(orderList);
return `-----------------------------------
总计：${getPriceCalculater(promotion.type)(orderList)}元
===================================`;
}

function buildDescribeForPromotion(promotionType, orderList){
  const originPrice = getPriceCalculater('origin')(orderList);
  const promotion = loadPromotions();
  const halfFareItems = promotion.find(p => p.type === '指定菜品半价').items;
  switch(promotionType) {
    case '满30减6元':
      return `${promotionType}，省${originPrice - getPriceCalculater('满30减6元')(orderList)}元`;
    case '指定菜品半价':
      const items = orderList.filter(o => halfFareItems.find(a => a === o.id)).map(i => i.name).join('，');
      return `${promotionType}(${items})，省${originPrice - getPriceCalculater('指定菜品半价')(orderList)}元`;
    case 'origin':
    default:
      return '';
  }
}

function chooseTheBestPromotion(orderList) {
  const promotions = [{type:'origin'}].concat(loadPromotions()).map(p => {
    return {...p, calculatePrice: getPriceCalculater(p.type)}
  })
  
  const sort = promotions.sort((current, next) => {
    const currentPrice = current.calculatePrice(orderList)
    const nextPrice = next.calculatePrice(orderList)
    return currentPrice - nextPrice;
  });

  return sort[0];
}


function getPriceCalculater(promotionType){
  const promotions = loadPromotions();
  const halfFareItems = promotions.find(p => p.type === '指定菜品半价').items;
  switch(promotionType) {
    case '满30减6元':
      return (orderList) => {
        const total = orderList.reduce((acc, current) => acc += current.count * current.price, 0);
        return total - Math.floor(total/30) * 6;
      };
    case '指定菜品半价': 
      return (orderList) => {
        return orderList.reduce((acc, current) => {
          if(halfFareItems.find(h => h === current.id)) {
            acc += current.count * current.price / 2;
            return acc;
          }
          acc += current.count * current.price;
          return acc;
        }, 0)
      };
    case 'origin':
    default: return (orderList) => orderList.reduce((acc, current) => acc += current.count * current.price, 0);
  }
}