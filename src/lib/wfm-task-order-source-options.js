// Dynamic display and existing selection options for every US Visa import card.
// Does NOT change import attribution, validation, or uploads.
const ELIGIBLE_SOURCES = new Set(['FUSECOM','FUSENET','HERODASH']);
export function withSourceTaskOrderOptions(cards, publishedOptions = [], {loaded = false} = {}) {
  return (cards || []).map((card) => {
    if (card.account !== 'US VISA') return card;
    const source = String(card.sourceLabel || '').toUpperCase().replace(/\s+/g,'');
    const sourceBound = ELIGIBLE_SOURCES.has(source);
    const allProgram = card.groupLabel === 'EMAIL LEVEL';
    // MS Dynamics (documented calls) and Quality Audit have no verified
    // per-tool ownership. Their badges must remain empty rather than guessed.
    if (!sourceBound && !allProgram) return {...card,taskOrders:[]};
    const options = loaded ? publishedOptions.filter((item) => {
      return String(item.sourceSystem || '').toUpperCase() !== '' &&
        (allProgram || String(item.sourceSystem).toUpperCase() === source);
    }).map((item)=>({id:item.value,label:String(item.label || item.value).replace(/^.*?\bTO\s*\d+\s*[-–]?\s*/i,'').trim() || item.value})) : [];
    return {...card,taskOrders:options, taskOrdersLoading:!loaded};
  });
}
