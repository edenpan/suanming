// 易经分析服务模块
// 完全基于logic/yijing.txt的原始逻辑实现

class YijingAnalyzer {
  constructor() {
    this.initializeHexagrams();
  }

  // 易经分析主函数
  performYijingAnalysis(inputData) {
    try {
      const { question, user_id, birth_data } = inputData;
      const currentTime = new Date();
      const hexagramData = this.generateHexagram(currentTime, user_id);
      const mainHexagramInfo = this.getHexagramInfo(hexagramData.mainHex);
      const changingHexagramInfo = this.getChangingHexagram(mainHexagramInfo, hexagramData.changingLines);
      const changingLineAnalysis = this.analyzeChangingLines(mainHexagramInfo, hexagramData.changingLines);

      return {
        analysis_type: 'yijing',
        analysis_date: currentTime.toISOString().split('T')[0],
        basic_info: {
          divination_data: {
            question: question,
            divination_time: currentTime.toISOString(),
            method: '梅花易数时间起卦法'
          },
          hexagram_info: {
            main_hexagram: mainHexagramInfo.name,
            main_hexagram_symbol: mainHexagramInfo.symbol,
            changing_hexagram: changingHexagramInfo ? changingHexagramInfo.name : '无',
            changing_hexagram_symbol: changingHexagramInfo ? changingHexagramInfo.symbol : '无',
            changing_lines: hexagramData.changingLines,
            detailed_interpretation: `您得到的本卦是【${mainHexagramInfo.name}】，${mainHexagramInfo.judgment}`
          }
        },
        detailed_analysis: {
          hexagram_analysis: {
            primary_meaning: `【${mainHexagramInfo.name}卦】 - ${mainHexagramInfo.meaning}`,
            judgment: `【彖传】曰：${mainHexagramInfo.judgment}`,
            image: `【象传】曰：${mainHexagramInfo.image}`
          },
          changing_lines_analysis: changingLineAnalysis,
          changing_hexagram_analysis: changingHexagramInfo ? {
            name: `变卦为【${changingHexagramInfo.name}】`,
            meaning: changingHexagramInfo.meaning,
            transformation_insight: `从【${mainHexagramInfo.name}】到【${changingHexagramInfo.name}】的变化，预示着：${changingHexagramInfo.transformation || '事态将发生转变'}`
          } : {
            name: '无变卦',
            meaning: '事态稳定，应以本卦为主要参考。',
            transformation_insight: '没有动爻，表示当前状况将持续一段时间，应专注于当下。'
          }
        },
        life_guidance: {
          overall_fortune: this.generateOverallFortune(mainHexagramInfo, changingHexagramInfo, question),
          career_guidance: this.generateCareerAdvice(mainHexagramInfo, changingHexagramInfo),
          relationship_guidance: this.generateRelationshipAdvice(mainHexagramInfo, changingHexagramInfo)
        },
        divination_wisdom: {
          key_message: mainHexagramInfo.keyMessage || '保持平常心，顺势而为',
          action_advice: mainHexagramInfo.actionAdvice || '谨慎行事，稳步前进',
          warning: mainHexagramInfo.warning || '无特别警示',
          philosophical_insight: `《易经》${mainHexagramInfo.name}卦的核心智慧在于：${mainHexagramInfo.philosophy || '顺应自然，把握时机'}`
        }
      };
    } catch (error) {
      console.error('易经分析详细错误:', error);
      throw error;
    }
  }

  // 生成卦象
  generateHexagram(currentTime, userId) {
    const year = currentTime.getFullYear();
    const month = currentTime.getMonth() + 1;
    const day = currentTime.getDate();
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    
    const userFactor = userId ? parseInt(String(userId).slice(-5).replace(/[^0-9]/g, '') || '12', 10) : 12;
    
    const upperTrigramNum = (year + month + day + userFactor) % 8 || 8;
    const lowerTrigramNum = (year + month + day + hour + minute + userFactor) % 8 || 8;
    const changingLinePos = (year + month + day + hour + minute + userFactor) % 6 + 1;
    
    const mainHexNumber = this.getHexagramNumber(upperTrigramNum, lowerTrigramNum);
    
    return {
      mainHex: mainHexNumber,
      changingLines: [changingLinePos]
    };
  }

  // 获取卦象编号
  getHexagramNumber(upper, lower) {
    const trigramMap = {
      1: '乾', 2: '兑', 3: '离', 4: '震',
      5: '巽', 6: '坎', 7: '艮', 8: '坤'
    };
    
    const upperName = trigramMap[upper];
    const lowerName = trigramMap[lower];
    
    for (const hexNum in this.ALL_HEXAGRAMS) {
      const hex = this.ALL_HEXAGRAMS[hexNum];
      if (hex.upperTrigram === upperName && hex.lowerTrigram === lowerName) {
        return parseInt(hexNum);
      }
    }
    return 1;
  }

  // 获取卦象信息
  getHexagramInfo(hexNumber) {
    return this.ALL_HEXAGRAMS[hexNumber] || this.ALL_HEXAGRAMS[1];
  }

  // 分析动爻
  analyzeChangingLines(hexagramInfo, changingLines) {
    if (!changingLines || changingLines.length === 0) {
      return {
        method: '以本卦卦辞为断',
        analysis: `无动爻，应以【${hexagramInfo.name}】的整体卦辞为主要判断依据。`,
        guidance: hexagramInfo.judgment
      };
    }
    
    const linePos = changingLines[0];
    const lineIndex = linePos - 1;
    const lineData = hexagramInfo.lines[lineIndex];
    
    if (!lineData) {
      return {
        method: '动爻分析异常',
        analysis: '无法找到对应的爻辞信息。',
        guidance: ''
      };
    }
    
    const lineName = ['初', '二', '三', '四', '五', '上'][lineIndex] + (lineData.type === 'yang' ? '九' : '六');
    
    return {
      method: '以动爻爻辞为断',
      changing_line_position: `${lineName}（第${linePos}爻）`,
      line_meaning: `【爻辞】曰：${lineData.text}`,
      line_image_meaning: `【象传】对该爻的解释：${lineData.image}`,
      guidance: `当前阶段的关键点在于理解和应对"${lineData.text}"所揭示的情况。`
    };
  }

  // 获取变卦
  getChangingHexagram(originalHexInfo, changingLines) {
    if (!changingLines || changingLines.length === 0) {
      return null;
    }
    
    let originalBinary = originalHexInfo.binary;
    changingLines.forEach(linePos => {
      const index = 6 - linePos;
      if (index >= 0 && index < 6) {
        const charArray = originalBinary.split('');
        charArray[index] = charArray[index] === '1' ? '0' : '1';
        originalBinary = charArray.join('');
      }
    });
    
    for (const hexNum in this.ALL_HEXAGRAMS) {
      if (this.ALL_HEXAGRAMS[hexNum].binary === originalBinary) {
        return this.ALL_HEXAGRAMS[hexNum];
      }
    }
    return null;
  }

  // 生成整体运势分析
  generateOverallFortune(mainHex, changeHex, question) {
    let fortune = `针对您的问题"${question}"，本卦为【${mainHex.name}】，指示了当前的基本状况：${mainHex.guidance}。`;
    
    if (changeHex) {
      fortune += ` 动爻预示着变化，未来趋势可参考变卦【${changeHex.name}】：${changeHex.guidance}。`;
    } else {
      fortune += ` 事态稳定，应专注于当前状况。`;
    }
    
    return fortune;
  }

  // 生成事业建议
  generateCareerAdvice(mainHex, changeHex) {
    let advice = `事业方面，本卦【${mainHex.name}】给出的指引是："${mainHex.career || mainHex.guidance}"。`;
    
    if (changeHex) {
      advice += ` 考虑到变卦为【${changeHex.name}】，未来发展可能转向"${changeHex.career || changeHex.guidance}"的方向，需提前准备。`;
    }
    
    return advice;
  }

  // 生成感情建议
  generateRelationshipAdvice(mainHex, changeHex) {
    let advice = `感情方面，本卦【${mainHex.name}】的启示是："${mainHex.relationship || mainHex.guidance}"。`;
    
    if (changeHex) {
      advice += ` 动爻的变化指向【${changeHex.name}】卦，暗示关系可能朝"${changeHex.relationship || changeHex.guidance}"演变，请注意把握。`;
    }
    
    return advice;
  }

  // 初始化64卦数据
  initializeHexagrams() {
    this.ALL_HEXAGRAMS = {
      1: {
        number: 1, name: '乾', symbol: '䷀', binary: '111111',
        upperTrigram: '乾', lowerTrigram: '乾',
        meaning: '创造，力量，活动',
        judgment: '元亨，利贞。',
        image: '天行健，君子以自强不息。',
        guidance: '充满创造力和能量，是采取行动和领导的绝佳时机。保持正直和坚持，将获得巨大成功。',
        career: '适合开拓新项目，担任领导角色。你的权威和能力会得到认可。',
        relationship: '关系中充满活力和激情。适合主动，但需避免过于强势。',
        keyMessage: '自强不息',
        actionAdvice: '积极行动，坚持不懈',
        philosophy: '天道刚健，君子应效法天道，奋发图强。',
        lines: [
          { type: 'yang', text: '潜龙勿用。', image: '阳在下也。' },
          { type: 'yang', text: '见龙在田，利见大人。', image: '德施普也。' },
          { type: 'yang', text: '君子终日乾乾，夕惕若厉，无咎。', image: '反复道也。' },
          { type: 'yang', text: '或跃在渊，无咎。', image: '进无咎也。' },
          { type: 'yang', text: '飞龙在天，利见大人。', image: '大人造也。' },
          { type: 'yang', text: '亢龙有悔。', image: '盈不可久也。' }
        ]
      },
      2: {
        number: 2, name: '坤', symbol: '䷁', binary: '000000',
        upperTrigram: '坤', lowerTrigram: '坤',
        meaning: '接受，滋养，顺从',
        judgment: '元亨，利牝马之贞。',
        image: '地势坤，君子以厚德载物。',
        guidance: '以柔顺和包容的态度面对挑战。通过支持他人和耐心等待，将获得成功。',
        career: '适合支持性角色，通过团队合作和服务他人获得成功。',
        relationship: '关系中需要更多的理解和包容。适合倾听和支持伴侣。',
        keyMessage: '厚德载物',
        actionAdvice: '以柔克刚，包容万物',
        philosophy: '地道柔顺，君子应效法大地，厚德载物。',
        lines: [
          { type: 'yin', text: '履霜，坚冰至。', image: '履霜坚冰，阴始凝也。' },
          { type: 'yin', text: '直，方，大，不习无不利。', image: '六二之动，直以方也。' },
          { type: 'yin', text: '含章可贞。或从王事，无成有终。', image: '含章可贞，以时发也。' },
          { type: 'yin', text: '括囊；无咎，无誉。', image: '括囊无咎，慎不害也。' },
          { type: 'yin', text: '黄裳，元吉。', image: '黄裳元吉，文在中也。' },
          { type: 'yin', text: '龙战于野，其血玄黄。', image: '龙战于野，其道穷也。' }
        ]
      }
    };
    
    // 第3-10卦的完整数据
    this.ALL_HEXAGRAMS[3] = {
      number: 3,
      name: '屯',
      symbol: '䷂',
      binary: '010001',
      upperTrigram: '坎',
      lowerTrigram: '震',
      meaning: '初生，困难，聚集',
      judgment: '元亨，利贞。勿用有攸往，利建侯。',
      image: '云雷，屯。君子以经纶。',
      guidance: '开始阶段会遇到困难，像种子在发芽。需要耐心和毅力，不要急于求成，但要建立基础和秩序。',
      career: '新项目或新职位初期会遇到挑战。关键是建立好框架和计划，而不是急于扩张。',
      relationship: '新关系开始时可能会有不确定性。需要耐心培养，建立信任。',
      keyMessage: '艰难起步',
      actionAdvice: '耐心建立基础',
      philosophy: '万物初生皆艰难，君子应在此时规划未来，建立秩序。',
      lines: [
        { type: 'yang', text: '磐桓，利居贞，利建侯。', image: '以贵下贱，大得民也。' },
        { type: 'yin', text: '屯如邅如，乘马班如。匪寇婚媾，女子贞不字，十年乃字。', image: '六二之难，乘刚也。' },
        { type: 'yin', text: '即鹿无虞，惟入于林中。君子几，不如舍，往吝。', image: '即鹿无虞，以从禽也。' },
        { type: 'yin', text: '乘马班如，求婚媾，往吉，无不利。', image: '求而往，明也。' },
        { type: 'yang', text: '屯其膏，小贞吉，大贞凶。', image: '屯其膏，施未光也。' },
        { type: 'yin', text: '乘马班如，泣血涟如。', image: '何可长也。' }
      ]
    };

    this.ALL_HEXAGRAMS[4] = {
      number: 4,
      name: '蒙',
      symbol: '䷃',
      binary: '100010',
      upperTrigram: '艮',
      lowerTrigram: '坎',
      meaning: '启蒙，无知，教育',
      judgment: '亨。匪我求童蒙，童蒙求我。初筮告，再三渎，渎则不告。利贞。',
      image: '山下出泉，蒙。君子以果行育德。',
      guidance: '处于学习和启蒙阶段。保持谦逊和开放的心态，寻求有智慧的指导。不要因为困惑而停止前进。',
      career: '适合学习新技能或进入新领域。寻找一位导师或榜样对你非常有益。',
      relationship: '关系中可能存在误解或不成熟。需要清晰、真诚的沟通来消除困惑。',
      keyMessage: '启蒙育德',
      actionAdvice: '虚心求教，果断行动',
      philosophy: '山下出泉，水流不定，象征蒙昧。君子应以果敢的行动来培养品德。',
      lines: [
        { type: 'yin', text: '发蒙，利用刑人，用说桎梏，以往吝。', image: '利用刑人，以正法也。' },
        { type: 'yang', text: '包蒙，吉。纳妇，吉。子克家。', image: '子克家，刚柔接也。' },
        { type: 'yin', text: '勿用取女，见金夫，不有躬，无攸利。', image: '勿用取女，行不顺也。' },
        { type: 'yin', text: '困蒙，吝。', image: '困蒙之吝，独远实也。' },
        { type: 'yin', text: '童蒙，吉。', image: '童蒙之吉，顺以巽也。' },
        { type: 'yang', text: '击蒙，不利为寇，利御寇。', image: '利御寇，上下顺也。' }
      ]
    };

    this.ALL_HEXAGRAMS[5] = {
      number: 5,
      name: '需',
      symbol: '䷄',
      binary: '111010',
      upperTrigram: '坎',
      lowerTrigram: '乾',
      meaning: '等待，滋养，需求',
      judgment: '有孚，光亨，贞吉。利涉大川。',
      image: '云上于天，需。君子以饮食宴乐。',
      guidance: '现在是耐心等待的时机。时机尚未成熟，急于行动会导致失败。利用这段时间积蓄力量，做好准备。',
      career: '项目进展可能会延迟。不要强行推进，利用时间完善计划和策略。',
      relationship: '关系发展需要耐心。给彼此一些时间和空间，等待合适的时机。',
      keyMessage: '耐心等待',
      actionAdvice: '积蓄力量，待机而动',
      philosophy: '云在天上，雨水尚未降下，象征等待。君子应在此期间休养生息，享受生活。',
      lines: [
        { type: 'yang', text: '需于郊，利用恒，无咎。', image: '需于郊，不犯难行也。' },
        { type: 'yang', text: '需于沙，小有言，终吉。', image: '需于沙，衍在中也。' },
        { type: 'yang', text: '需于泥，致寇至。', image: '需于泥，灾在外也。' },
        { type: 'yin', text: '需于血，出自穴。', image: '需于血，顺以听也。' },
        { type: 'yang', text: '需于酒食，贞吉。', image: '酒食贞吉，以中正也。' },
        { type: 'yin', text: '入于穴，有不速之客三人来，敬之终吉。', image: '不速之客来，敬之终吉。虽不当位，未大失也。' }
      ]
    };

    this.ALL_HEXAGRAMS[6] = {
      number: 6,
      name: '讼',
      symbol: '䷅',
      binary: '010111',
      upperTrigram: '乾',
      lowerTrigram: '坎',
      meaning: '冲突，争论，诉讼',
      judgment: '有孚，窒惕，中吉。终凶。利见大人，不利涉大川。',
      image: '天与水违行，讼。君子以作事谋始。',
      guidance: '可能会遇到冲突和争论。保持冷静和公正，寻求调解是明智的。将冲突升级会导致不良后果。',
      career: '工作中可能出现分歧或法律纠纷。避免正面冲突，寻求第三方仲裁或和解。',
      relationship: '关系中可能出现争吵。关键是沟通和理解，而不是争论谁对谁错。',
      keyMessage: '止息争讼',
      actionAdvice: '寻求和解，避免冲突',
      philosophy: '天水相违，象征争讼。君子在做事之初就应谋划周全，以避免未来的争端。',
      lines: [
        { type: 'yin', text: '不永所事，小有言，终吉。', image: '不永所事，讼不可长也。' },
        { type: 'yang', text: '不克讼，归而逋，其邑人三百户，无眚。', image: '不克讼，归逋窜也。' },
        { type: 'yin', text: '食旧德，贞厉，终吉。或从王事，无成。', image: '食旧德，从上吉也。' },
        { type: 'yang', text: '不克讼，复即命，渝安贞，吉。', image: '复即命，渝安贞，不失也。' },
        { type: 'yang', text: '讼，元吉。', image: '讼元吉，以中正也。' },
        { type: 'yang', text: '或锡之鞶带，终朝三褫之。', image: '以讼受服，亦不足敬也。' }
      ]
    };

    this.ALL_HEXAGRAMS[7] = {
      number: 7,
      name: '师',
      symbol: '䷆',
      binary: '000010',
      upperTrigram: '坤',
      lowerTrigram: '坎',
      meaning: '军队，纪律，组织',
      judgment: '贞，丈人吉，无咎。',
      image: '地中有水，师。君子以容民畜众。',
      guidance: '需要纪律、组织和领导力。像将军一样，你需要一个明确的目标和一群忠诚的追随者。',
      career: '适合领导团队或管理大型项目。需要建立清晰的规则和强大的组织能力。',
      relationship: '家庭或团队中需要建立秩序和规则。明确的角色和责任有助于和谐。',
      keyMessage: '师出有名',
      actionAdvice: '建立纪律，统一行动',
      philosophy: '地下藏水，象征军队。君子应效法大地容纳江河，包容民众，蓄养力量。',
      lines: [
        { type: 'yin', text: '师出以律，否臧凶。', image: '师出以律，失次凶也。' },
        { type: 'yang', text: '在师中，吉，无咎，王三锡命。', image: '在师中吉，承天宠也。' },
        { type: 'yin', text: '师或舆尸，凶。', image: '师或舆尸，大无功也。' },
        { type: 'yin', text: '师左次，无咎。', image: '左次无咎，未失常也。' },
        { type: 'yin', text: '田有禽，利执言，无咎。长子帅师，弟子舆尸，贞凶。', image: '长子帅师，以中行也。' },
        { type: 'yin', text: '大君有命，开国承家，小人勿用。', image: '大君有命，以正功也。' }
      ]
    };

    this.ALL_HEXAGRAMS[8] = {
      number: 8,
      name: '比',
      symbol: '䷇',
      binary: '010000',
      upperTrigram: '坎',
      lowerTrigram: '坤',
      meaning: '联合，亲近，和谐',
      judgment: '吉。原筮，元永贞，无咎。不宁方来，后夫凶。',
      image: '地上有水，比。先王以建万国，亲诸侯。',
      guidance: '这是联合和亲近的时期。寻求与他人建立和谐的关系，找到志同道合的伙伴。',
      career: '团队合作和建立良好的人际网络是成功的关键。',
      relationship: '加强与伴侣、家人和朋友的联系。这是建立更深层次情感纽带的好时机。',
      keyMessage: '亲密无间',
      actionAdvice: '加强联合，促进和谐',
      philosophy: '水在地上，相亲相辅，象征联合。古代君王因此分封万国，亲近诸侯。',
      lines: [
        { type: 'yin', text: '有孚比之，无咎。有孚盈缶，终来有他吉。', image: '比之初六，有他吉也。' },
        { type: 'yin', text: '比之自内，贞吉。', image: '比之自内，不自失也。' },
        { type: 'yin', text: '比之匪人。', image: '比之匪人，不亦伤乎！' },
        { type: 'yin', text: '外比之，贞吉。', image: '外比于贤，以从上也。' },
        { type: 'yang', text: '显比，王用三驱，失前禽。邑人不诫，吉。', image: '显比之吉，位正中也。' },
        { type: 'yin', text: '比之无首，凶。', image: '比之无首，无所终也。' }
      ]
    };

    this.ALL_HEXAGRAMS[9] = {
      number: 9,
      name: '小畜',
      symbol: '䷈',
      binary: '110111',
      upperTrigram: '巽',
      lowerTrigram: '乾',
      meaning: '小的积蓄，节制，养育',
      judgment: '亨。密云不雨，自我西郊。',
      image: '风行天上，小畜。君子以懿文德。',
      guidance: '现在是积蓄力量、培养品德的时期。虽然有大志，但时机未到，需要耐心等待和积累。',
      career: '适合积累经验、学习技能，为将来的大发展做准备。不要急于求成。',
      relationship: '关系需要慢慢培养，不要急于推进。通过小事情积累感情。',
      keyMessage: '积小成大',
      actionAdvice: '积蓄力量，等待时机',
      philosophy: '风在天上吹，象征小的积蓄。君子应在此期间修养文德，完善自我。',
      lines: [
        { type: 'yang', text: '复自道，何其咎？吉。', image: '复自道，其义吉也。' },
        { type: 'yang', text: '牵复，吉。', image: '牵复在中，亦不自失也。' },
        { type: 'yang', text: '舆说辐，夫妻反目。', image: '夫妻反目，不能正室也。' },
        { type: 'yin', text: '有孚，血去惕出，无咎。', image: '有孚惕出，上合志也。' },
        { type: 'yang', text: '有孚挛如，富以其邻。', image: '有孚挛如，不独富也。' },
        { type: 'yang', text: '既雨既处，尚德载，妇贞厉。月几望，君子征凶。', image: '既雨既处，德积载也。君子征凶，有所疑也。' }
      ]
    };

    this.ALL_HEXAGRAMS[10] = {
      number: 10,
      name: '履',
      symbol: '䷉',
      binary: '111011',
      upperTrigram: '乾',
      lowerTrigram: '兑',
      meaning: '履行，实践，礼仪',
      judgment: '履虎尾，不咥人，亨。',
      image: '上天下泽，履。君子以辩上下，定民志。',
      guidance: '需要谨慎行事，像在老虎尾巴后面行走一样。遵循正确的礼仪和规范，可以避免危险。',
      career: '工作中需要谨慎行事，遵守规则和程序。不要冒险，按部就班地推进。',
      relationship: '交往中要尊重对方，遵循适当的礼仪。避免冒犯，保持礼貌。',
      keyMessage: '谨慎行事',
      actionAdvice: '遵循规范，避免冒险',
      philosophy: '天在上，泽在下，上下分明。君子应分辨上下，安定民心。',
      lines: [
        { type: 'yang', text: '素履，往无咎。', image: '素履之往，独行愿也。' },
        { type: 'yang', text: '履道坦坦，幽人贞吉。', image: '幽人贞吉，中不自乱也。' },
        { type: 'yin', text: '眇能视，跛能履，履虎尾咥人，凶。武人为于大君。', image: '眇能视，不足以有明也。跛能履，不足以与行也。咥人之凶，位不当也。武人为于大君，志刚也。' },
        { type: 'yang', text: '履虎尾，愬愬终吉。', image: '愬愬终吉，志行也。' },
        { type: 'yang', text: '夬履，贞厉。', image: '夬履贞厉，位正当也。' },
        { type: 'yang', text: '视履考祥，其旋元吉。', image: '元吉在上，大有庆也。' }
      ]
    };

    // 第11-20卦的完整数据
    this.ALL_HEXAGRAMS[11] = {
      number: 11,
      name: '泰',
      symbol: '䷊',
      binary: '000111',
      upperTrigram: '坤',
      lowerTrigram: '乾',
      meaning: '通达，和谐，安泰',
      judgment: '小往大来，吉，亨。',
      image: '天地交，泰。后以财成天地之道，辅相天地之宜，以左右民。',
      guidance: '天地交泰，万物和谐。这是一个吉祥的时期，适合开展各种活动，将获得丰厚的回报。',
      career: '事业顺利，合作愉快。适合扩大规模，开拓新领域。',
      relationship: '关系和谐美满，沟通顺畅。是深化感情的好时机。',
      keyMessage: '天地交泰',
      actionAdvice: '顺势而为，积极发展',
      philosophy: '天地交感，万物通泰。君主应顺应天地之道，辅助教化民众。',
      lines: [
        { type: 'yang', text: '拔茅茹，以其汇，征吉。', image: '拔茅征吉，志在外也。' },
        { type: 'yang', text: '包荒，用冯河，不遐遗，朋亡，得尚于中行。', image: '包荒，得尚于中行，以光大也。' },
        { type: 'yang', text: '无平不陂，无往不复，艰贞无咎。勿恤其孚，于食有福。', image: '无往不复，天地际也。' },
        { type: 'yin', text: '翩翩不富以其邻，不戒以孚。', image: '翩翩不富，皆失实也。不戒以孚，中心愿也。' },
        { type: 'yin', text: '帝乙归妹，以祉元吉。', image: '以祉元吉，中以行愿也。' },
        { type: 'yin', text: '城复于隍，勿用师。自邑告命，贞吝。', image: '城复于隍，其命乱也。' }
      ]
    };

    this.ALL_HEXAGRAMS[12] = {
      number: 12,
      name: '否',
      symbol: '䷋',
      binary: '111000',
      upperTrigram: '乾',
      lowerTrigram: '坤',
      meaning: '阻塞，不通，黑暗',
      judgment: '否之匪人，不利君子贞，大往小来。',
      image: '天地不交，否。君子以俭德辟难，不可荣以禄。',
      guidance: '天地不交，万物不通。这是一个困难的时期，需要保持低调，避免大的行动。',
      career: '事业发展受阻，不宜扩张。应保守经营，等待时机好转。',
      relationship: '关系出现隔阂，沟通不畅。需要耐心和理解，避免冲突。',
      keyMessage: '韬光养晦',
      actionAdvice: '保守行事，等待转机',
      philosophy: '天地不交，象征闭塞。君子应节俭修德，避免灾难，不贪求禄位。',
      lines: [
        { type: 'yin', text: '拔茅茹，以其汇，贞吉，亨。', image: '拔茅贞吉，志在君也。' },
        { type: 'yin', text: '包承，小人吉，大人否，亨。', image: '大人否亨，不乱群也。' },
        { type: 'yin', text: '包羞。', image: '包羞，位不当也。' },
        { type: 'yang', text: '有命无咎，畴离祉。', image: '有命无咎，志行也。' },
        { type: 'yang', text: '休否，大人吉。其亡其亡，系于苞桑。', image: '大人之吉，位正当也。' },
        { type: 'yang', text: '倾否，先否后喜。', image: '否终则倾，何可长也。' }
      ]
    };

    this.ALL_HEXAGRAMS[13] = {
      number: 13,
      name: '同人',
      symbol: '䷌',
      binary: '101111',
      upperTrigram: '乾',
      lowerTrigram: '离',
      meaning: '同人，团结，和谐',
      judgment: '同人于野，亨。利涉大川，利君子贞。',
      image: '天与火，同人。君子以类族辨物。',
      guidance: '这是团结合作的时期。与志同道合的人联合，可以克服困难，实现远大目标。',
      career: '团队合作将带来成功。寻找有共同目标的伙伴，共同努力。',
      relationship: '与伴侣或朋友同心协力，关系将更加牢固和谐。',
      keyMessage: '同心协力',
      actionAdvice: '寻求合作，团结一致',
      philosophy: '天与火同升，象征同心同德。君子应分类辨物，团结众人。',
      lines: [
        { type: 'yang', text: '同人于门，无咎。', image: '出门同人，又谁咎也。' },
        { type: 'yin', text: '同人于宗，吝。', image: '同人于宗，吝道也。' },
        { type: 'yang', text: '伏戎于莽，升其高陵，三岁不兴。', image: '伏戎于莽，敌刚也。三岁不兴，安行也。' },
        { type: 'yang', text: '乘其墉，弗克攻，吉。', image: '乘其墉，义弗克也。其吉，则困而反则也。' },
        { type: 'yang', text: '同人，先号咷而后笑，大师克相遇。', image: '同人之先，以中直也。大师相遇，言相克也。' },
        { type: 'yang', text: '同人于郊，无悔。', image: '同人于郊，志未得也。' }
      ]
    };

    this.ALL_HEXAGRAMS[14] = {
      number: 14,
      name: '大有',
      symbol: '䷍',
      binary: '111101',
      upperTrigram: '离',
      lowerTrigram: '乾',
      meaning: '大有，丰盛，富有',
      judgment: '元亨。',
      image: '火在天上，大有。君子以遏恶扬善，顺天休命。',
      guidance: '这是一个丰盛富足的时期。拥有很多资源和机会，应当善用这些优势，同时保持谦逊。',
      career: '事业兴旺，资源丰富。适合扩大规模，但要避免骄傲自满。',
      relationship: '关系充实美满，感情丰富。要珍惜现有的幸福，避免过度索取。',
      keyMessage: '丰盛富足',
      actionAdvice: '善用资源，保持谦逊',
      philosophy: '火在天上，光明普照，象征大有。君子应抑恶扬善，顺应天命。',
      lines: [
        { type: 'yang', text: '无交害，匪咎，艰则无咎。', image: '大有初九，无交害也。' },
        { type: 'yang', text: '大车以载，有攸往，无咎。', image: '大车以载，积中不败也。' },
        { type: 'yang', text: '公用亨于天子，小人弗克。', image: '公用亨于天子，小人害也。' },
        { type: 'yang', text: '匪其彭，无咎。', image: '匪其彭，无咎，明辨皙也。' },
        { type: 'yin', text: '厥孚交如，威如，吉。', image: '厥孚交如，信以发志也。威如之吉，易而无备也。' },
        { type: 'yang', text: '自天佑之，吉无不利。', image: '大有上吉，自天佑也。' }
      ]
    };

    this.ALL_HEXAGRAMS[15] = {
      number: 15,
      name: '谦',
      symbol: '䷎',
      binary: '001000',
      upperTrigram: '坤',
      lowerTrigram: '艮',
      meaning: '谦虚，谦逊，低调',
      judgment: '亨，君子有终。',
      image: '地中有山，谦。君子以裒多益寡，称物平施。',
      guidance: '保持谦虚和低调。真正的力量在于内在的谦逊，这将带来长久的成功和尊重。',
      career: '即使取得成就也要保持谦逊。谦虚的态度会赢得更多支持和机会。',
      relationship: '在关系中保持谦逊，不炫耀，不争强好胜，会让感情更加和谐。',
      keyMessage: '谦虚受益',
      actionAdvice: '保持谦逊，低调行事',
      philosophy: '山在地中，象征谦虚。君子应减少过多，补充不足，公平施予。',
      lines: [
        { type: 'yin', text: '谦谦君子，用涉大川，吉。', image: '谦谦君子，卑以自牧也。' },
        { type: 'yin', text: '鸣谦，贞吉。', image: '鸣谦贞吉，中心得也。' },
        { type: 'yang', text: '劳谦，君子有终，吉。', image: '劳谦君子，万民服也。' },
        { type: 'yin', text: '无不利，撝谦。', image: '无不利撝谦，不违则也。' },
        { type: 'yin', text: '不富以其邻，利用侵伐，无不利。', image: '利用侵伐，征不服也。' },
        { type: 'yin', text: '鸣谦，利用行师，征邑国。', image: '鸣谦，志未得也。可用行师，征邑国也。' }
      ]
    };

    this.ALL_HEXAGRAMS[16] = {
      number: 16,
      name: '豫',
      symbol: '䷏',
      binary: '000100',
      upperTrigram: '震',
      lowerTrigram: '坤',
      meaning: '喜悦，预备，娱乐',
      judgment: '利建侯行师。',
      image: '雷出地奋，豫。先王以作乐崇德，殷荐之上帝，以配祖考。',
      guidance: '这是一个喜悦和预备的时期。保持乐观的心态，为未来的行动做好准备。',
      career: '适合制定计划，为未来的发展做准备。保持积极的态度。',
      relationship: '享受当下的美好时光，同时为关系的进一步发展做准备。',
      keyMessage: '喜悦预备',
      actionAdvice: '保持乐观，做好准备',
      philosophy: '雷出地上，万物振奋，象征喜悦。古代君王因此制礼作乐，推崇德行。',
      lines: [
        { type: 'yin', text: '鸣豫，凶。', image: '初六鸣豫，志穷凶也。' },
        { type: 'yin', text: '介于石，不终日，贞吉。', image: '不终日贞吉，以中正也。' },
        { type: 'yin', text: '盱豫悔，迟有悔。', image: '盱豫有悔，位不当也。' },
        { type: 'yang', text: '由豫，大有得，勿疑朋盍簪。', image: '由豫大有得，志大行也。' },
        { type: 'yin', text: '贞疾，恒不死。', image: '六五贞疾，乘刚也。恒不死，中未亡也。' },
        { type: 'yin', text: '冥豫，成有渝，无咎。', image: '冥豫在上，何可长也。' }
      ]
    };

    this.ALL_HEXAGRAMS[17] = {
      number: 17,
      name: '随',
      symbol: '䷐',
      binary: '100110',
      upperTrigram: '兑',
      lowerTrigram: '震',
      meaning: '跟随，顺应，随和',
      judgment: '元亨，利贞，无咎。',
      image: '泽中有雷，随。君子以向晦入宴息。',
      guidance: '这是顺应时势、跟随领导的时期。保持灵活和适应性，将获得顺利的发展。',
      career: '适合跟随有经验的领导或团队，学习经验，不要急于出头。',
      relationship: '在关系中保持随和，跟随对方的节奏，会让关系更加和谐。',
      keyMessage: '顺势而为',
      actionAdvice: '保持灵活，跟随领导',
      philosophy: '雷在泽中，象征跟随。君子应顺应天时，该休息时休息。',
      lines: [
        { type: 'yang', text: '官有渝，贞吉。出门交有功。', image: '官有渝，从正吉也。出门交有功，不失也。' },
        { type: 'yin', text: '系小子，失丈夫。', image: '系小子，弗兼与也。' },
        { type: 'yin', text: '系丈夫，失小子。随有求得，利居贞。', image: '系丈夫，志舍下也。' },
        { type: 'yang', text: '随有获，贞凶。有孚在道，以明，何咎。', image: '随有获，其义凶也。有孚在道，明功也。' },
        { type: 'yang', text: '孚于嘉，吉。', image: '孚于嘉吉，位正中也。' },
        { type: 'yin', text: '拘系之，乃从维之。王用亨于西山。', image: '拘系之，上穷也。' }
      ]
    };

    this.ALL_HEXAGRAMS[18] = {
      number: 18,
      name: '蛊',
      symbol: '䷑',
      binary: '011001',
      upperTrigram: '艮',
      lowerTrigram: '巽',
      meaning: '腐败，革新，整治',
      judgment: '元亨，利涉大川。先甲三日，后甲三日。',
      image: '山下有风，蛊。君子以振民育德。',
      guidance: '需要革新和整治腐败。虽然面临困难，但这是必要的改革，将带来新的生机。',
      career: '需要改革或整顿工作环境。虽然过程艰难，但会带来更好的发展。',
      relationship: '关系中需要清理积弊，重新开始。需要勇气和决心。',
      keyMessage: '革新整治',
      actionAdvice: '勇于改革，清理积弊',
      philosophy: '山下有风，象征腐败。君子应振奋民心，培育德行。',
      lines: [
        { type: 'yin', text: '干父之蛊，有子，考无咎，厉终吉。', image: '干父之蛊，意承考也。' },
        { type: 'yang', text: '干母之蛊，不可贞。', image: '干母之蛊，得中道也。' },
        { type: 'yin', text: '干父之蛊，小有悔，无大咎。', image: '干父之蛊，终无咎也。' },
        { type: 'yin', text: '裕父之蛊，往见吝。', image: '裕父之蛊，往未得也。' },
        { type: 'yin', text: '干父之蛊，用誉。', image: '干父用誉，承以德也。' },
        { type: 'yang', text: '不事王侯，高尚其事。', image: '不事王侯，志可则也。' }
      ]
    };

    this.ALL_HEXAGRAMS[19] = {
      number: 19,
      name: '临',
      symbol: '䷒',
      binary: '110000',
      upperTrigram: '坤',
      lowerTrigram: '兑',
      meaning: '临近，监督，领导',
      judgment: '元亨，利贞。至于八月有凶。',
      image: '泽上有地，临。君子以教思无穷，容保民无疆。',
      guidance: '处于领导或监督的位置。需要以开放的心态接近他人，给予指导和保护。',
      career: '适合担任领导或管理角色。需要亲近团队，给予支持和指导。',
      relationship: '在关系中扮演保护者和指导者的角色，给予对方安全感和支持。',
      keyMessage: '亲近指导',
      actionAdvice: '亲近他人，给予指导',
      philosophy: '地在泽上，象征临近。君子应教化无穷，包容保护民众。',
      lines: [
        { type: 'yin', text: '咸临，贞吉。', image: '咸临贞吉，志行正也。' },
        { type: 'yin', text: '咸临，吉无不利。', image: '咸临吉无不利，未顺命也。' },
        { type: 'yin', text: '甘临，无攸利。既忧之，无咎。', image: '甘临，位不当也。既忧之，咎不长也。' },
        { type: 'yin', text: '至临，无咎。', image: '至临无咎，位当也。' },
        { type: 'yang', text: '知临，大君之宜，吉。', image: '大君之宜，行中之谓也。' },
        { type: 'yin', text: '敦临，吉无咎。', image: '敦临之吉，志在内也。' }
      ]
    };

    this.ALL_HEXAGRAMS[20] = {
      number: 20,
      name: '观',
      symbol: '䷓',
      binary: '000011',
      upperTrigram: '巽',
      lowerTrigram: '坤',
      meaning: '观察，展示，省察',
      judgment: '盥而不荐，有孚颙若。',
      image: '风行地上，观。先王以省方观民设教。',
      guidance: '需要仔细观察和审视。像祭祀前洗手一样，保持虔诚和专注的态度。',
      career: '适合观察市场动向，学习他人经验。不要急于行动，先了解情况。',
      relationship: '需要更多观察和理解对方。保持耐心和关注。',
      keyMessage: '仔细观察',
      actionAdvice: '保持专注，深入了解',
      philosophy: '风行地上，遍观万物。古代君王因此巡视四方，观察民情，设立教化。',
      lines: [
        { type: 'yin', text: '童观，小人无咎，君子吝。', image: '初六童观，小人道也。' },
        { type: 'yin', text: '窥观，利女贞。', image: '窥观女贞，亦可丑也。' },
        { type: 'yin', text: '观我生，进退。', image: '观我生，进退未失道也。' },
        { type: 'yin', text: '观国之光，利用宾于王。', image: '观国之光，尚宾也。' },
        { type: 'yang', text: '观我生，君子无咎。', image: '观我生，观民也。' },
        { type: 'yang', text: '观其生，君子无咎。', image: '观其生，志未平也。' }
      ]
    };

    // 第21-30卦的完整数据
    this.ALL_HEXAGRAMS[21] = {
      number: 21,
      name: '噬嗑',
      symbol: '䷔',
      binary: '100101',
      upperTrigram: '离',
      lowerTrigram: '震',
      meaning: '咬合，刑罚，决断',
      judgment: '亨。利用狱。',
      image: '雷电，噬嗑。先王以明罚敕法。',
      guidance: '需要果断处理障碍和问题。像咬合一样，清除阻碍，恢复通畅。',
      career: '需要解决工作中的障碍或冲突。采取果断措施，清除问题。',
      relationship: '关系中需要解决积累的矛盾。坦诚沟通，消除误会。',
      keyMessage: '果断处理',
      actionAdvice: '清除障碍，解决问题',
      philosophy: '雷电交加，象征咬合。古代君王因此明正刑罚，整饬法度。',
      lines: [
        { type: 'yin', text: '屦校灭趾，无咎。', image: '屦校灭趾，不行也。' },
        { type: 'yin', text: '噬肤灭鼻，无咎。', image: '噬肤灭鼻，乘刚也。' },
        { type: 'yin', text: '噬腊肉，遇毒，小吝，无咎。', image: '遇毒，位不当也。' },
        { type: 'yang', text: '噬干胏，得金矢，利艰贞，吉。', image: '利艰贞吉，未光也。' },
        { type: 'yin', text: '噬干肉，得黄金，贞厉，无咎。', image: '贞厉无咎，得当也。' },
        { type: 'yang', text: '何校灭耳，凶。', image: '何校灭耳，聪不明也。' }
      ]
    };

    this.ALL_HEXAGRAMS[22] = {
      number: 22,
      name: '贲',
      symbol: '䷕',
      binary: '101001',
      upperTrigram: '艮',
      lowerTrigram: '离',
      meaning: '装饰，美化，文饰',
      judgment: '亨。小利有攸往。',
      image: '山下有火，贲。君子以明庶政，无敢折狱。',
      guidance: '需要适当的装饰和美化。注重外表和形式，但不要忽视内在的本质。',
      career: '适合改善形象，提升外在表现。但要注意实质内容的提升。',
      relationship: '关系中需要一些浪漫和美化，让感情更加丰富多彩。',
      keyMessage: '适度装饰',
      actionAdvice: '美化外表，注重实质',
      philosophy: '山下有火，光辉照耀，象征装饰。君子应明察政务，不轻率断案。',
      lines: [
        { type: 'yang', text: '贲其趾，舍车而徒。', image: '舍车而徒，义弗乘也。' },
        { type: 'yin', text: '贲其须。', image: '贲其须，与上兴也。' },
        { type: 'yang', text: '贲如濡如，永贞吉。', image: '永贞之吉，终莫之陵也。' },
        { type: 'yin', text: '贲如皤如，白马翰如，匪寇婚媾。', image: '六四当位疑也。匪寇婚媾，终无尤也。' },
        { type: 'yin', text: '贲于丘园，束帛戋戋，吝，终吉。', image: '六五之吉，有喜也。' },
        { type: 'yang', text: '白贲，无咎。', image: '白贲无咎，上得志也。' }
      ]
    };

    this.ALL_HEXAGRAMS[23] = {
      number: 23,
      name: '剥',
      symbol: '䷖',
      binary: '000001',
      upperTrigram: '艮',
      lowerTrigram: '坤',
      meaning: '剥落，侵蚀，衰败',
      judgment: '不利有攸往。',
      image: '山附于地，剥。上以厚下安宅。',
      guidance: '处于衰败和剥落的时期。需要接受现实，保存实力，等待时机好转。',
      career: '事业可能面临衰退或困难。需要保守经营，减少损失。',
      relationship: '关系可能出现裂痕或疏远。需要耐心修复，或接受现实。',
      keyMessage: '保存实力',
      actionAdvice: '接受现实，等待转机',
      philosophy: '山附于地，象征剥落。上位者应厚待下民，安定居所。',
      lines: [
        { type: 'yin', text: '剥床以足，蔑贞凶。', image: '剥床以足，以灭下也。' },
        { type: 'yin', text: '剥床以辨，蔑贞凶。', image: '剥床以辨，未有与也。' },
        { type: 'yin', text: '剥之，无咎。', image: '剥之无咎，失上下也。' },
        { type: 'yin', text: '剥床以肤，凶。', image: '剥床以肤，切近灾也。' },
        { type: 'yin', text: '贯鱼，以宫人宠，无不利。', image: '以宫人宠，终无尤也。' },
        { type: 'yang', text: '硕果不食，君子得舆，小人剥庐。', image: '君子得舆，民所载也。小人剥庐，终不可用也。' }
      ]
    };

    this.ALL_HEXAGRAMS[24] = {
      number: 24,
      name: '复',
      symbol: '䷗',
      binary: '100000',
      upperTrigram: '坤',
      lowerTrigram: '震',
      meaning: '回复，复兴，回归',
      judgment: '亨。出入无疾，朋来无咎。反复其道，七日来复，利有攸往。',
      image: '雷在地中，复。先王以至日闭关，商旅不行，后不省方。',
      guidance: '这是复兴和回归的时期。像冬至后阳气回复一样，新的开始即将到来。',
      career: '事业将迎来转机，新的开始。保持信心，准备重新出发。',
      relationship: '关系将得到改善或重新开始。给彼此一个新的机会。',
      keyMessage: '复兴回归',
      actionAdvice: '准备新生，重新开始',
      philosophy: '雷在地中，象征阳气回复。古代君王在冬至闭关静养，顺应天时。',
      lines: [
        { type: 'yin', text: '不远复，无祗悔，元吉。', image: '不远之复，以修身也。' },
        { type: 'yin', text: '休复，吉。', image: '休复之吉，以下仁也。' },
        { type: 'yin', text: '频复，厉无咎。', image: '频复之厉，义无咎也。' },
        { type: 'yin', text: '中行独复。', image: '中行独复，以从道也。' },
        { type: 'yin', text: '敦复，无悔。', image: '敦复无悔，中以自考也。' },
        { type: 'yin', text: '迷复，凶，有灾眚。用行师，终有大败，以其国君，凶，至于十年不克征。', image: '迷复之凶，反君道也。' }
      ]
    };

    this.ALL_HEXAGRAMS[25] = {
      number: 25,
      name: '无妄',
      symbol: '䷘',
      binary: '100111',
      upperTrigram: '乾',
      lowerTrigram: '震',
      meaning: '无妄，真诚，不妄为',
      judgment: '元亨，利贞。其匪正有眚，不利有攸往。',
      image: '天下雷行，物与无妄。先王以茂对时育万物。',
      guidance: '保持真诚和正直，不要轻举妄动。顺应自然规律，将获得顺利发展。',
      career: '工作中保持诚实正直，不要投机取巧。踏实做事会带来成功。',
      relationship: '在关系中保持真诚，不要虚伪做作。真诚是感情的基础。',
      keyMessage: '真诚无妄',
      actionAdvice: '保持真诚，顺应自然',
      philosophy: '天下雷行，万物各正其命。古代君王因此顺应天时，养育万物。',
      lines: [
        { type: 'yang', text: '无妄，往吉。', image: '无妄之往，得志也。' },
        { type: 'yin', text: '不耕获，不菑畲，则利有攸往。', image: '不耕获，未富也。' },
        { type: 'yin', text: '无妄之灾，或系之牛，行人之得，邑人之灾。', image: '行人得牛，邑人灾也。' },
        { type: 'yang', text: '可贞，无咎。', image: '可贞无咎，固有之也。' },
        { type: 'yang', text: '无妄之疾，勿药有喜。', image: '无妄之药，不可试也。' },
        { type: 'yin', text: '无妄，行有眚，无攸利。', image: '无妄之行，穷之灾也。' }
      ]
    };

    this.ALL_HEXAGRAMS[26] = {
      number: 26,
      name: '大畜',
      symbol: '䷙',
      binary: '111001',
      upperTrigram: '艮',
      lowerTrigram: '乾',
      meaning: '大畜，积蓄，停止',
      judgment: '利贞。不家食吉。利涉大川。',
      image: '天在山中，大畜。君子以多识前言往行，以畜其德。',
      guidance: '这是一个大量积蓄和准备的时期。积累知识、经验和资源，为将来大发展做准备。',
      career: '适合大量学习和积累经验，为将来的事业腾飞做准备。',
      relationship: '关系中需要积蓄感情和信任，为长远发展打下基础。',
      keyMessage: '大量积蓄',
      actionAdvice: '积累知识，准备未来',
      philosophy: '天在山中，象征大量积蓄。君子应多学先贤言行，积蓄德行。',
      lines: [
        { type: 'yang', text: '有厉，利已。', image: '有厉利已，不犯灾也。' },
        { type: 'yang', text: '舆说輹。', image: '舆说輹，中无尤也。' },
        { type: 'yang', text: '良马逐，利艰贞。曰闲舆卫，利有攸往。', image: '利有攸往，上合志也。' },
        { type: 'yin', text: '童牛之牿，元吉。', image: '六四元吉，有喜也。' },
        { type: 'yin', text: '豮豕之牙，吉。', image: '六五之吉，有庆也。' },
        { type: 'yang', text: '何天之衢，亨。', image: '何天之衢，道大行也。' }
      ]
    };

    this.ALL_HEXAGRAMS[27] = {
      number: 27,
      name: '颐',
      symbol: '䷚',
      binary: '100001',
      upperTrigram: '艮',
      lowerTrigram: '震',
      meaning: '颐养，饮食，养生',
      judgment: '贞吉。观颐，自求口实。',
      image: '山下有雷，颐。君子以慎言语，节饮食。',
      guidance: '注重养生和内在调养。注意言行举止，合理饮食，保持身心健康。',
      career: '工作中要注意劳逸结合，保养身体，才能持续发展。',
      relationship: '关系中需要相互照顾和滋养，建立健康的关系模式。',
      keyMessage: '颐养身心',
      actionAdvice: '注意养生，保持健康',
      philosophy: '山下有雷，象征颐养。君子应谨慎言语，节制饮食。',
      lines: [
        { type: 'yang', text: '舍尔灵龟，观我朵颐，凶。', image: '观我朵颐，亦不足贵也。' },
        { type: 'yin', text: '颠颐，拂经，于丘颐，征凶。', image: '六二征凶，行失类也。' },
        { type: 'yin', text: '拂颐，贞凶，十年勿用，无攸利。', image: '十年勿用，道大悖也。' },
        { type: 'yin', text: '颠颐，吉。虎视眈眈，其欲逐逐，无咎。', image: '颠颐之吉，上施光也。' },
        { type: 'yin', text: '拂经，居贞吉，不可涉大川。', image: '居贞之吉，顺以从上也。' },
        { type: 'yang', text: '由颐，厉吉，利涉大川。', image: '由颐厉吉，大有庆也。' }
      ]
    };

    // 第28-40卦的完整数据
    this.ALL_HEXAGRAMS[28] = {
      number: 28,
      name: '大过',
      symbol: '䷛',
      binary: '011110',
      upperTrigram: '兑',
      lowerTrigram: '巽',
      meaning: '大过，过度，极端',
      judgment: '栋桡，利有攸往，亨。',
      image: '泽灭木，大过。君子以独立不惧，遯世无闷。',
      guidance: '处于非常时期，需要采取非常措施。虽然过度，但这是必要的。',
      career: '面临重大挑战，需要采取非常手段。要有勇气和决心。',
      relationship: '关系中可能出现极端情况，需要非常处理。',
      keyMessage: '非常时期',
      actionAdvice: '采取非常措施，勇敢面对',
      philosophy: '泽水淹没树木，象征过度。君子应独立不惧，避世不闷。',
      lines: [
        { type: 'yin', text: '藉用白茅，无咎。', image: '藉用白茅，柔在下也。' },
        { type: 'yang', text: '枯杨生稊，老夫得其女妻，无不利。', image: '老夫女妻，过以相与也。' },
        { type: 'yang', text: '栋桡，凶。', image: '栋桡之凶，不可以有辅也。' },
        { type: 'yang', text: '栋隆，吉。有它吝。', image: '栋隆之吉，不桡乎下也。' },
        { type: 'yin', text: '枯杨生华，老妇得其士夫，无咎无誉。', image: '枯杨生华，何可久也。老妇士夫，亦可丑也。' },
        { type: 'yin', text: '过涉灭顶，凶，无咎。', image: '过涉之凶，不可咎也。' }
      ]
    };

    this.ALL_HEXAGRAMS[29] = {
      number: 29,
      name: '坎',
      symbol: '䷜',
      binary: '010010',
      upperTrigram: '坎',
      lowerTrigram: '坎',
      meaning: '坎险，危险，陷溺',
      judgment: '习坎，有孚，维心亨，行有尚。',
      image: '水洊至，习坎。君子以常德行，习教事。',
      guidance: '面临重重困难和危险。保持诚信和坚定的信念，终将度过难关。',
      career: '事业面临重重困难，需要谨慎应对。保持信心，不要放弃。',
      relationship: '关系陷入困难时期，需要共同努力克服。',
      keyMessage: '度过险关',
      actionAdvice: '保持诚信，坚定信念',
      philosophy: '水重叠而来，象征重重险难。君子应保持常德，熟习政教。',
      lines: [
        { type: 'yin', text: '习坎，入于坎窞，凶。', image: '习坎入坎，失道凶也。' },
        { type: 'yang', text: '坎有险，求小得。', image: '求小得，未出中也。' },
        { type: 'yin', text: '来之坎坎，险且枕，入于坎窞，勿用。', image: '来之坎坎，终无功也。' },
        { type: 'yin', text: '樽酒簋贰，用缶，纳约自牖，终无咎。', image: '樽酒簋贰，刚柔际也。' },
        { type: 'yang', text: '坎不盈，祇既平，无咎。', image: '坎不盈，中未大也。' },
        { type: 'yin', text: '系用徽纆，置于丛棘，三岁不得，凶。', image: '上六失道，凶三岁也。' }
      ]
    };

    this.ALL_HEXAGRAMS[30] = {
      number: 30,
      name: '离',
      symbol: '䷝',
      binary: '101101',
      upperTrigram: '离',
      lowerTrigram: '离',
      meaning: '离明，光明，附丽',
      judgment: '利贞，亨。畜牝牛，吉。',
      image: '明两作，离。大人以继明照于四方。',
      guidance: '光明普照，事业顺利。保持光明正大的态度，将获得吉祥。',
      career: '事业光明，前景良好。保持正直，继续努力。',
      relationship: '关系明朗，感情深厚。保持真诚，珍惜彼此。',
      keyMessage: '光明正大',
      actionAdvice: '保持光明，继续努力',
      philosophy: '光明两次升起，象征光明。大人应连续光明，照耀四方。',
      lines: [
        { type: 'yang', text: '履错然，敬之，无咎。', image: '履错之敬，以辟咎也。' },
        { type: 'yin', text: '黄离，元吉。', image: '黄离元吉，得中道也。' },
        { type: 'yang', text: '日昃之离，不鼓缶而歌，则大耋之嗟，凶。', image: '日昃之离，何可久也。' },
        { type: 'yang', text: '突如其来如，焚如，死如，弃如。', image: '突如其来如，无所容也。' },
        { type: 'yin', text: '出涕沱若，戚嗟若，吉。', image: '六五之吉，离王公也。' },
        { type: 'yang', text: '王用出征，有嘉折首，获匪其丑，无咎。', image: '王用出征，以正邦也。' }
      ]
    };

    this.ALL_HEXAGRAMS[31] = {
      number: 31,
      name: '咸',
      symbol: '䷞',
      binary: '110100',
      upperTrigram: '兑',
      lowerTrigram: '艮',
      meaning: '感应，情感，交流',
      judgment: '亨，利贞。取女吉。',
      image: '山上有泽，咸。君子以虚受人。',
      guidance: '这是情感交流和感应的时期。保持开放的心态，真诚交流，将带来和谐。',
      career: '适合加强团队交流，增进感情。良好的人际关系将带来成功。',
      relationship: '感情交流顺畅，适合深化关系。真诚相待，感情将更加深厚。',
      keyMessage: '真诚感应',
      actionAdvice: '开放交流，真诚相待',
      philosophy: '山上有泽，二气感应。君子应虚心接受他人。',
      lines: [
        { type: 'yin', text: '咸其拇。', image: '咸其拇，志在外也。' },
        { type: 'yin', text: '咸其腓，凶，居吉。', image: '虽凶居吉，顺不害也。' },
        { type: 'yang', text: '咸其股，执其随，往吝。', image: '咸其股，亦不处也。志在随人，所执下也。' },
        { type: 'yang', text: '贞吉，悔亡。憧憧往来，朋从尔思。', image: '贞吉悔亡，未感害也。憧憧往来，未光大也。' },
        { type: 'yin', text: '咸其脢，无悔。', image: '咸其脢，志末也。' },
        { type: 'yin', text: '咸其辅颊舌。', image: '咸其辅颊舌，滕口说也。' }
      ]
    };

    this.ALL_HEXAGRAMS[32] = {
      number: 32,
      name: '恒',
      symbol: '䷟',
      binary: '001110',
      upperTrigram: '震',
      lowerTrigram: '巽',
      meaning: '恒久，持久，稳定',
      judgment: '亨，无咎，利贞。利有攸往。',
      image: '雷风，恒。君子以立不易方。',
      guidance: '建立长期稳定的关系或事业。持之以恒，坚持不懈，将获得持久成功。',
      career: '建立长期稳定的事业基础。坚持原则，持续发展。',
      relationship: '建立持久稳定的感情关系。相互理解，长久相伴。',
      keyMessage: '持之以恒',
      actionAdvice: '坚持原则，长期发展',
      philosophy: '雷风相随，象征恒久。君子应确立不变的原则。',
      lines: [
        { type: 'yin', text: '浚恒，贞凶，无攸利。', image: '浚恒之凶，始求深也。' },
        { type: 'yang', text: '悔亡。', image: '九二悔亡，能久中也。' },
        { type: 'yang', text: '不恒其德，或承之羞，贞吝。', image: '不恒其德，无所容也。' },
        { type: 'yin', text: '田无禽。', image: '久非其位，安得禽也。' },
        { type: 'yin', text: '恒其德，贞，妇人吉，夫子凶。', image: '妇人贞吉，从一而终也。夫子制义，从妇凶也。' },
        { type: 'yin', text: '振恒，凶。', image: '振恒在上，大无功也。' }
      ]
    };

    this.ALL_HEXAGRAMS[33] = {
      number: 33,
      name: '遁',
      symbol: '䷠',
      binary: '111100',
      upperTrigram: '乾',
      lowerTrigram: '艮',
      meaning: '退避，隐退，退让',
      judgment: '亨，小利贞。',
      image: '天下有山，遁。君子以远小人，不恶而严。',
      guidance: '这是需要退避的时期。面对不利局面，明智的选择是暂时退让，保全实力。',
      career: '事业遇到阻力时，学会适时退让，保存实力等待时机。',
      relationship: '关系紧张时，适当保持距离，避免冲突升级。',
      keyMessage: '适时退避',
      actionAdvice: '保存实力，等待时机',
      philosophy: '天下有山，象征退避。君子应远离小人，不恶而严。',
      lines: [
        { type: 'yin', text: '遁尾，厉，勿用有攸往。', image: '遁尾之厉，不往何灾也。' },
        { type: 'yin', text: '执之用黄牛之革，莫之胜说。', image: '执用黄牛，固志也。' },
        { type: 'yang', text: '系遁，有疾厉，畜臣妾吉。', image: '系遁之厉，有疾惫也。畜臣妾吉，不可大事也。' },
        { type: 'yang', text: '好遁，君子吉，小人否。', image: '君子好遁，小人否也。' },
        { type: 'yang', text: '嘉遁，贞吉。', image: '嘉遁贞吉，以正志也。' },
        { type: 'yang', text: '肥遁，无不利。', image: '肥遁无不利，无所疑也。' }
      ]
    };

    this.ALL_HEXAGRAMS[34] = {
      number: 34,
      name: '大壮',
      symbol: '䷡',
      binary: '111000',
      upperTrigram: '震',
      lowerTrigram: '乾',
      meaning: '大壮，强壮，强盛',
      judgment: '利贞。',
      image: '雷在天上，大壮。君子以非礼弗履。',
      guidance: '力量强盛的时期，但要谨慎使用力量，遵循正道，避免滥用。',
      career: '事业处于强盛期，但要谨慎行事，避免过度扩张。',
      relationship: '关系力量对比明显，强者要体恤弱者，保持平衡。',
      keyMessage: '谨慎用强',
      actionAdvice: '遵循正道，避免滥用',
      philosophy: '雷在天上，象征强大。君子应不行非礼之事。',
      lines: [
        { type: 'yang', text: '壮于趾，征凶，有孚。', image: '壮于趾，其孚穷也。' },
        { type: 'yang', text: '贞吉。', image: '九二贞吉，以中也。' },
        { type: 'yang', text: '小人用壮，君子用罔，贞厉。羝羊触藩，羸其角。', image: '小人用壮，君子罔也。' },
        { type: 'yang', text: '贞吉，悔亡。藩决不羸，壮于大舆之輹。', image: '藩决不羸，尚往也。' },
        { type: 'yin', text: '丧羊于易，无悔。', image: '丧羊于易，位不当也。' },
        { type: 'yin', text: '羝羊触藩，不能退，不能遂，无攸利，艰则吉。', image: '不能退，不能遂，不祥也。艰则吉，咎不长也。' }
      ]
    };

    this.ALL_HEXAGRAMS[35] = {
      number: 35,
      name: '晋',
      symbol: '䷢',
      binary: '101000',
      upperTrigram: '离',
      lowerTrigram: '坤',
      meaning: '晋升，前进，发展',
      judgment: '康侯用锡马蕃庶，昼日三接。',
      image: '明出地上，晋。君子以自昭明德。',
      guidance: '事业和地位将获晋升。光明正大前进，必获成功。',
      career: '事业将迎来晋升和发展机遇。把握机会，光明正大前进。',
      relationship: '关系将向前发展，地位提升。保持谦逊，继续努力。',
      keyMessage: '光明晋升',
      actionAdvice: '把握机会，光明正大',
      philosophy: '光明出现在地上，象征晋升。君子应彰显自己的美德。',
      lines: [
        { type: 'yin', text: '晋如摧如，贞吉。罔孚，裕无咎。', image: '晋如摧如，独行正也。裕无咎，未受命也。' },
        { type: 'yin', text: '晋如愁如，贞吉。受兹介福，于其王母。', image: '受兹介福，以中正也。' },
        { type: 'yang', text: '众允，悔亡。', image: '众允之志，上行也。' },
        { type: 'yang', text: '晋如鼫鼠，贞厉。', image: '鼫鼠贞厉，位不当也。' },
        { type: 'yin', text: '悔亡，失得勿恤，往吉，无不利。', image: '失得勿恤，往有庆也。' },
        { type: 'yang', text: '晋其角，维用伐邑，厉吉，无咎，贞吝。', image: '维用伐邑，道未光也。' }
      ]
    };

    // 第36-50卦的完整数据
    this.ALL_HEXAGRAMS[36] = {
      number: 36,
      name: '明夷',
      symbol: '䷣',
      binary: '010001',
      upperTrigram: '坤',
      lowerTrigram: '离',
      meaning: '明夷，光明受损，韬光养晦',
      judgment: '利艰贞。',
      image: '明入地中，明夷。君子以莅众，用晦而明。',
      guidance: '光明受损的时期，需要韬光养晦，隐藏实力，等待时机。',
      career: '事业受阻时，要低调行事，保存实力，等待东山再起。',
      relationship: '关系出现阴影时，要包容理解，给彼此空间。',
      keyMessage: '韬光养晦',
      actionAdvice: '隐藏实力，等待时机',
      philosophy: '光明进入地中，象征光明受损。君子治理众人，用晦而明。',
      lines: [
        { type: 'yin', text: '明夷于飞，垂其翼。君子于行，三日不食。有攸往，主人有言。', image: '君子于行，义不食也。' },
        { type: 'yin', text: '明夷，夷于左股，用拯马壮，吉。', image: '六二之吉，顺以则也。' },
        { type: 'yang', text: '明夷于南狩，得其大首，不可疾贞。', image: '南狩之志，乃大得也。' },
        { type: 'yin', text: '入于左腹，获明夷之心，于出门庭。', image: '入于左腹，获心意也。' },
        { type: 'yin', text: '箕子之明夷，利贞。', image: '箕子之贞，明不可息也。' },
        { type: 'yin', text: '不明晦，初登于天，后入于地。', image: '初登于天，照四国也。后入于地，失则也。' }
      ]
    };

    this.ALL_HEXAGRAMS[37] = {
      number: 37,
      name: '家人',
      symbol: '䷤',
      binary: '110101',
      upperTrigram: '巽',
      lowerTrigram: '离',
      meaning: '家人，家庭，家人关系',
      judgment: '利女贞。',
      image: '风自火出，家人。君子以言有物而行有恒。',
      guidance: '注重家庭关系，建立和谐家庭。家庭成员各守其位，家庭和睦。',
      career: '事业与家庭要平衡，家庭和睦是事业成功的基础。',
      relationship: '建立和谐的家庭关系，相互理解，共同经营。',
      keyMessage: '家庭和睦',
      actionAdvice: '各守其位，和谐相处',
      philosophy: '风从火出，象征家人。君子说话有内容，行为有常度。',
      lines: [
        { type: 'yang', text: '闲有家，悔亡。', image: '闲有家，志未变也。' },
        { type: 'yin', text: '无攸遂，在中馈，贞吉。', image: '六二之吉，顺以巽也。' },
        { type: 'yang', text: '家人嗃嗃，悔厉吉。妇子嘻嘻，终吝。', image: '家人嗃嗃，未失也。妇子嘻嘻，失家节也。' },
        { type: 'yin', text: '富家，大吉。', image: '富家大吉，顺在位也。' },
        { type: 'yang', text: '王假有家，勿恤，吉。', image: '王假有家，交相爱也。' },
        { type: 'yang', text: '有孚威如，终吉。', image: '威如之吉，反身之谓也。' }
      ]
    };

    this.ALL_HEXAGRAMS[38] = {
      number: 38,
      name: '睽',
      symbol: '䷥',
      binary: '010110',
      upperTrigram: '离',
      lowerTrigram: '兑',
      meaning: '睽违，分离，矛盾',
      judgment: '小事吉。',
      image: '上火下泽，睽。君子以同而异。',
      guidance: '存在分歧和矛盾的时期。求同存异，小处着手，逐步化解矛盾。',
      career: '团队存在分歧，需要求同存异，从小事做起改善关系。',
      relationship: '关系出现裂痕，需要沟通理解，小步改善。',
      keyMessage: '求同存异',
      actionAdvice: '小处着手，逐步改善',
      philosophy: '上火下泽，象征相违。君子应同中有异，异中求同。',
      lines: [
        { type: 'yang', text: '悔亡。丧马勿逐，自复。见恶人无咎。', image: '见恶人，以辟咎也。' },
        { type: 'yin', text: '遇主于巷，无咎。', image: '遇主于巷，未失道也。' },
        { type: 'yin', text: '见舆曳，其牛掣，其人天且劓，无初有终。', image: '见舆曳，位不当也。无初有终，遇刚也。' },
        { type: 'yang', text: '睽孤，遇元夫，交孚，厉无咎。', image: '交孚无咎，志行也。' },
        { type: 'yin', text: '悔亡。厥宗噬肤，往何咎。', image: '厥宗噬肤，往有庆也。' },
        { type: 'yang', text: '睽孤，见豕负涂，载鬼一车，先张之弧，后说之弧，匪寇婚媾，往遇雨则吉。', image: '遇雨之吉，群疑亡也。' }
      ]
    };

    this.ALL_HEXAGRAMS[39] = {
      number: 39,
      name: '蹇',
      symbol: '䷦',
      binary: '001010',
      upperTrigram: '坎',
      lowerTrigram: '艮',
      meaning: '蹇难，困难，险阻',
      judgment: '利西南，不利东北。利见大人，贞吉。',
      image: '山上有水，蹇。君子以反身修德。',
      guidance: '面临重重困难的时期。反省自身，修德养性，寻求贵人帮助。',
      career: '事业遇到重大困难，需要反省改进，寻求指导。',
      relationship: '关系遇到困难，需要反思自身，改善沟通。',
      keyMessage: '反省修德',
      actionAdvice: '寻求指导，改善自身',
      philosophy: '山上有水，象征险阻。君子应反省自身，修养德行。',
      lines: [
        { type: 'yin', text: '往蹇，来誉。', image: '往蹇来誉，宜待也。' },
        { type: 'yang', text: '王臣蹇蹇，匪躬之故。', image: '王臣蹇蹇，终无尤也。' },
        { type: 'yin', text: '往蹇，来反。', image: '往蹇来反，内喜之也。' },
        { type: 'yin', text: '往蹇，来连。', image: '往蹇来连，当位实也。' },
        { type: 'yang', text: '大蹇，朋来。', image: '大蹇朋来，以中节也。' },
        { type: 'yin', text: '往蹇，来硕，吉。利见大人。', image: '往蹇来硕，志在内也。利见大人，以从贵也。' }
      ]
    };

    this.ALL_HEXAGRAMS[40] = {
      number: 40,
      name: '解',
      symbol: '䷧',
      binary: '010100',
      upperTrigram: '震',
      lowerTrigram: '坎',
      meaning: '解除，解脱，解决',
      judgment: '利西南。无所往，其来复吉。有攸往，夙吉。',
      image: '雷雨作，解。君子以赦过宥罪。',
      guidance: '困难即将解除，问题得到解决。释放压力，重新开始。',
      career: '事业困境即将解除，可以重新开始发展。',
      relationship: '关系中的矛盾将得到化解，重获和谐。',
      keyMessage: '解除困境',
      actionAdvice: '释放压力，重新开始',
      philosophy: '雷雨大作，象征解除。君子应赦免过错，宽宥罪恶。',
      lines: [
        { type: 'yin', text: '无咎。', image: '刚柔之际，义无咎也。' },
        { type: 'yang', text: '田获三狐，得黄矢，贞吉。', image: '九二贞吉，得中道也。' },
        { type: 'yin', text: '负且乘，致寇至，贞吝。', image: '负且乘，亦可丑也。自我致戎，又谁咎也。' },
        { type: 'yang', text: '解而拇，朋至斯孚。', image: '解而拇，未当位也。' },
        { type: 'yin', text: '君子维有解，吉，有孚于小人。', image: '君子有解，小人退也。' },
        { type: 'yang', text: '公用射隼于高墉之上，获之，无不利。', image: '公用射隼，以解悖也。' }
      ]
    };

    this.ALL_HEXAGRAMS[41] = {
      number: 41,
      name: '损',
      symbol: '䷨',
      binary: '110001',
      upperTrigram: '艮',
      lowerTrigram: '兑',
      meaning: '减损，减少，损失',
      judgment: '有孚，元吉，无咎，可贞。利有攸往。曷之用？二簋可用享。',
      image: '山下有泽，损。君子以惩忿窒欲。',
      guidance: '需要减损和放弃的时期。减少不必要的欲望和开支，将获得更大收益。',
      career: '事业需要精简和优化，减少不必要的开支，提高效率。',
      relationship: '关系中需要减少争执和欲望，增进理解和包容。',
      keyMessage: '精简减损',
      actionAdvice: '减少欲望，增进效率',
      philosophy: '山下有泽，象征减损。君子应抑制愤怒，遏制欲望。',
      lines: [
        { type: 'yang', text: '已事遄往，无咎，酌损之。', image: '已事遄往，尚合志也。' },
        { type: 'yang', text: '利贞，征凶，弗损益之。', image: '九二利贞，中以为志也。' },
        { type: 'yin', text: '三人行，则损一人；一人行，则得其友。', image: '一人行，三则疑也。' },
        { type: 'yin', text: '损其疾，使遄有喜，无咎。', image: '损其疾，亦可喜也。' },
        { type: 'yin', text: '或益之，十朋之龟弗克违，元吉。', image: '六五元吉，自上佑也。' },
        { type: 'yang', text: '弗损益之，无咎，贞吉。利有攸往，得臣无家。', image: '弗损益之，大得志也。' }
      ]
    };

    this.ALL_HEXAGRAMS[42] = {
      number: 42,
      name: '益',
      symbol: '䷩',
      binary: '100011',
      upperTrigram: '巽',
      lowerTrigram: '震',
      meaning: '增益，增加，受益',
      judgment: '利有攸往，利涉大川。',
      image: '风雷，益。君子以见善则迁，有过则改。',
      guidance: '这是增益和发展的时期。积极行动，将获得丰厚回报。',
      career: '事业将迎来发展和增益，积极行动，把握机会。',
      relationship: '关系将得到增进和改善，相互帮助，共同进步。',
      keyMessage: '积极增益',
      actionAdvice: '积极行动，把握机会',
      philosophy: '风雷相助，象征增益。君子应见善则迁，有过则改。',
      lines: [
        { type: 'yang', text: '利用为大作，元吉，无咎。', image: '元吉无咎，下不厚事也。' },
        { type: 'yin', text: '或益之，十朋之龟弗克违，永贞吉。王用享于帝，吉。', image: '或益之，自外来也。' },
        { type: 'yin', text: '益之用凶事，无咎。有孚中行，告公用圭。', image: '益用凶事，固有之也。' },
        { type: 'yang', text: '中行，告公从。利用为依迁国。', image: '告公从，以益志也。' },
        { type: 'yang', text: '有孚惠心，勿问元吉。有孚惠我德。', image: '有孚惠心，勿问之矣。惠我德，大得志也。' },
        { type: 'yin', text: '莫益之，或击之，立心勿恒，凶。', image: '莫益之，偏辞也。或击之，自外来也。' }
      ]
    };

    this.ALL_HEXAGRAMS[43] = {
      number: 43,
      name: '夬',
      symbol: '䷪',
      binary: '111110',
      upperTrigram: '兑',
      lowerTrigram: '乾',
      meaning: '决断，决裂，果断',
      judgment: '扬于王庭，孚号有厉。告自邑，不利即戎，利有攸往。',
      image: '泽上于天，夬。君子以施禄及下，居德则忌。',
      guidance: '需要果断决断的时期。面对问题要当机立断，不可犹豫不决。',
      career: '事业需要做出重大决策，果断行动，避免拖延。',
      relationship: '关系中需要做出决断，避免藕断丝连。',
      keyMessage: '果断决断',
      actionAdvice: '当机立断，避免拖延',
      philosophy: '泽水在天上，象征决断。君子应施恩于下，积德忌满。',
      lines: [
        { type: 'yang', text: '壮于前趾，往不胜为咎。', image: '不胜而往，咎也。' },
        { type: 'yang', text: '惕号，莫夜有戎，勿恤。', image: '有戎勿恤，得中道也。' },
        { type: 'yang', text: '壮于頄，有凶。君子夬夬，独行遇雨，若濡有愠，无咎。', image: '君子夬夬，终无咎也。' },
        { type: 'yang', text: '臀无肤，其行次且。牵羊悔亡，闻言不信。', image: '其行次且，位不当也。闻言不信，聪不明也。' },
        { type: 'yang', text: '苋陆夬夬，中行无咎。', image: '中行无咎，中未光也。' },
        { type: 'yin', text: '无号，终有凶。', image: '无号之凶，终不可长也。' }
      ]
    };

    this.ALL_HEXAGRAMS[44] = {
      number: 44,
      name: '姤',
      symbol: '䷫',
      binary: '011111',
      upperTrigram: '乾',
      lowerTrigram: '巽',
      meaning: '相遇，邂逅，阴遇阳',
      judgment: '女壮，勿用取女。',
      image: '天下有风，姤。后以施命诰四方。',
      guidance: '不期而遇的时期。小心处理新出现的关系，避免被不良影响。',
      career: '事业中遇到新的机遇或挑战，要谨慎处理。',
      relationship: '可能遇到新的感情或关系，需要谨慎对待。',
      keyMessage: '谨慎相遇',
      actionAdvice: '小心处理新关系',
      philosophy: '天下有风，象征相遇。君主应发布命令，告诫四方。',
      lines: [
        { type: 'yin', text: '系于金柅，贞吉。有攸往，见凶，羸豕孚蹢躅。', image: '系于金柅，柔道牵也。' },
        { type: 'yang', text: '包有鱼，无咎，不利宾。', image: '包有鱼，义不及宾也。' },
        { type: 'yang', text: '臀无肤，其行次且，厉，无大咎。', image: '其行次且，行未牵也。' },
        { type: 'yang', text: '包无鱼，起凶。', image: '无鱼之凶，远民也。' },
        { type: 'yang', text: '以杞包瓜，含章，有陨自天。', image: '九五含章，中正也。有陨自天，志不舍命也。' },
        { type: 'yang', text: '姤其角，吝，无咎。', image: '姤其角，上穷吝也。' }
      ]
    };

    // 第45-64卦的完整数据
    this.ALL_HEXAGRAMS[45] = {
      number: 45,
      name: '萃',
      symbol: '䷬',
      binary: '000110',
      upperTrigram: '兑',
      lowerTrigram: '坤',
      meaning: '聚集，集合，汇聚',
      judgment: '亨。王假有庙，利见大人，亨，利贞。用大牲吉，利有攸往。',
      image: '泽上于地，萃。君子以除戎器，戒不虞。',
      guidance: '这是聚集和团结的时期。集合力量，共同奋斗，将获得更大成功。',
      career: '事业需要集合团队力量，共同奋斗，实现更大目标。',
      relationship: '关系需要加强团结，共同面对挑战，增进感情。',
      keyMessage: '集合力量',
      actionAdvice: '团结奋斗，共同前进',
      philosophy: '泽水在地上，象征聚集。君子应修整兵器，戒备不测。',
      lines: [
        { type: 'yin', text: '有孚不终，乃乱乃萃，若号，一握为笑，勿恤，往无咎。', image: '乃乱乃萃，其志乱也。' },
        { type: 'yin', text: '引吉，无咎，孚乃利用禴。', image: '引吉无咎，中未变也。' },
        { type: 'yin', text: '萃如，嗟如，无攸利，往无咎，小吝。', image: '往无咎，上巽也。' },
        { type: 'yang', text: '大吉，无咎。', image: '大吉无咎，位不当也。' },
        { type: 'yang', text: '萃有位，无咎。匪孚，元永贞，悔亡。', image: '萃有位，志未光也。' },
        { type: 'yin', text: '赍咨涕洟，无咎。', image: '赍咨涕洟，未安上也。' }
      ]
    };

    this.ALL_HEXAGRAMS[46] = {
      number: 46,
      name: '升',
      symbol: '䷭',
      binary: '011000',
      upperTrigram: '坤',
      lowerTrigram: '巽',
      meaning: '上升，晋升，发展',
      judgment: '元亨，用见大人，勿恤，南征吉。',
      image: '地中生木，升。君子以顺德，积小以高大。',
      guidance: '事业和地位将不断上升。循序渐进，终将获得高位。',
      career: '事业将迎来上升期，循序渐进，稳步发展。',
      relationship: '关系将不断升温，感情日益深厚。',
      keyMessage: '循序渐进',
      actionAdvice: '稳步发展，终获成功',
      philosophy: '地中生出树木，象征上升。君子应顺应德行，积小成大。',
      lines: [
        { type: 'yin', text: '允升，大吉。', image: '允升大吉，上合志也。' },
        { type: 'yang', text: '孚乃利用禴，无咎。', image: '九二之孚，有喜也。' },
        { type: 'yang', text: '升虚邑。', image: '升虚邑，无所疑也。' },
        { type: 'yin', text: '王用亨于岐山，吉，无咎。', image: '王用亨于岐山，顺事也。' },
        { type: 'yang', text: '贞吉，升阶。', image: '贞吉升阶，大得志也。' },
        { type: 'yin', text: '冥升，利于不息之贞。', image: '冥升在上，消不富也。' }
      ]
    };

    this.ALL_HEXAGRAMS[47] = {
      number: 47,
      name: '困',
      symbol: '䷮',
      binary: '110010',
      upperTrigram: '兑',
      lowerTrigram: '坎',
      meaning: '困穷，困境，困顿',
      judgment: '亨，贞，大人吉，无咎。有言不信。',
      image: '泽无水，困。君子以致命遂志。',
      guidance: '处于困境的时期。虽处困境，但保持正道，终将脱困。',
      career: '事业陷入困境，需要坚持正道，寻求突破。',
      relationship: '关系陷入僵局，需要耐心化解，坚持信念。',
      keyMessage: '坚持正道',
      actionAdvice: '保持信念，寻求突破',
      philosophy: '泽中无水，象征困穷。君子应舍命达成志向。',
      lines: [
        { type: 'yin', text: '臀困于株木，入于幽谷，三岁不觌。', image: '入于幽谷，幽不明也。' },
        { type: 'yang', text: '困于酒食，朱绂方来，利用享祀，征凶，无咎。', image: '困于酒食，中有庆也。' },
        { type: 'yin', text: '困于石，据于蒺藜，入于其宫，不见其妻，凶。', image: '据于蒺藜，乘刚也。入于其宫，不见其妻，不祥也。' },
        { type: 'yang', text: '来徐徐，困于金车，吝，有终。', image: '来徐徐，志在下也。虽不当位，有与也。' },
        { type: 'yang', text: '劓刖，困于赤绂，乃徐有说，利用祭祀。', image: '劓刖志未得也。乃徐有说，以中直也。利用祭祀，受福也。' },
        { type: 'yin', text: '困于葛藟，于臲卼，曰动悔。有悔，征吉。', image: '困于葛藟，未当也。动悔有悔，吉行也。' }
      ]
    };

    this.ALL_HEXAGRAMS[48] = {
      number: 48,
      name: '井',
      symbol: '䷯',
      binary: '001011',
      upperTrigram: '坎',
      lowerTrigram: '巽',
      meaning: '水井，养人，恒常',
      judgment: '改邑不改井，无丧无得，往来井井。汔至，亦未繘井，羸其瓶，凶。',
      image: '木上有水，井。君子以劳民劝相。',
      guidance: '建立持久的基础，滋养他人。保持恒常，持续改善。',
      career: '建立稳固的事业基础，持续发展，滋养团队。',
      relationship: '建立稳定的关系基础，相互滋养，长久发展。',
      keyMessage: '建立基础',
      actionAdvice: '持续改善，滋养他人',
      philosophy: '木上有水，象征水井。君子应慰劳民众，劝勉相助。',
      lines: [
        { type: 'yin', text: '井泥不食，旧井无禽。', image: '井泥不食，下也。旧井无禽，时舍也。' },
        { type: 'yang', text: '井谷射鲋，瓮敝漏。', image: '井谷射鲋，无与也。' },
        { type: 'yang', text: '井渫不食，为我心恻。可用汲，王明，并受其福。', image: '井渫不食，行恻也。求王明，受福也。' },
        { type: 'yin', text: '井甃，无咎。', image: '井甃无咎，修井也。' },
        { type: 'yang', text: '井冽，寒泉食。', image: '寒泉之食，中正也。' },
        { type: 'yin', text: '井收勿幕，有孚元吉。', image: '元吉在上，大成也。' }
      ]
    };

    this.ALL_HEXAGRAMS[49] = {
      number: 49,
      name: '革',
      symbol: '䷰',
      binary: '101110',
      upperTrigram: '兑',
      lowerTrigram: '离',
      meaning: '变革，改革，革命',
      judgment: '己日乃孚，元亨利贞，悔亡。',
      image: '泽中有火，革。君子以治历明时。',
      guidance: '这是重大变革的时期。顺应时势，主动改革，将获得新生。',
      career: '事业需要重大变革，破旧立新，开创新局面。',
      relationship: '关系需要深度调整，改变旧模式，建立新关系。',
      keyMessage: '主动变革',
      actionAdvice: '破旧立新，顺应时势',
      philosophy: '泽中有火，象征变革。君子应修治历法，明确时令。',
      lines: [
        { type: 'yang', text: '巩用黄牛之革。', image: '巩用黄牛，不可以有为也。' },
        { type: 'yin', text: '己日乃革之，征吉，无咎。', image: '己日革之，行有嘉也。' },
        { type: 'yang', text: '征凶，贞厉。革言三就，有孚。', image: '革言三就，又何之矣。' },
        { type: 'yang', text: '悔亡，有孚改命，吉。', image: '改命之吉，信志也。' },
        { type: 'yang', text: '大人虎变，未占有孚。', image: '大人虎变，其文炳也。' },
        { type: 'yin', text: '君子豹变，小人革面，征凶，居贞吉。', image: '君子豹变，其文蔚也。小人革面，顺以从君也。' }
      ]
    };

    this.ALL_HEXAGRAMS[50] = {
      number: 50,
      name: '鼎',
      symbol: '䷱',
      binary: '011101',
      upperTrigram: '离',
      lowerTrigram: '巽',
      meaning: '鼎器，烹饪，养贤',
      judgment: '元吉，亨。',
      image: '木上有火，鼎。君子以正位凝命。',
      guidance: '建立新秩序，培养人才。正位凝命，成就大业。',
      career: '事业建立新体制，培养团队，成就大业。',
      relationship: '关系建立新秩序，相互培养，共同成长。',
      keyMessage: '建立新秩序',
      actionAdvice: '培养人才，成就大业',
      philosophy: '木上有火，象征鼎器。君子应端正位置，凝聚使命。',
      lines: [
        { type: 'yin', text: '鼎颠趾，利出否，得妾以其子，无咎。', image: '鼎颠趾，未悖也。利出否，以从贵也。' },
        { type: 'yin', text: '鼎有实，我仇有疾，不我能即，吉。', image: '鼎有实，慎所之也。我仇有疾，终无尤也。' },
        { type: 'yang', text: '鼎耳革，其行塞，雉膏不食，方雨亏悔，终吉。', image: '鼎耳革，失其义也。' },
        { type: 'yang', text: '鼎折足，覆公餗，其形渥，凶。', image: '覆公餗，信如何也。' },
        { type: 'yin', text: '鼎黄耳金铉，利贞。', image: '鼎黄耳，中以为实也。' },
        { type: 'yang', text: '鼎玉铉，大吉，无不利。', image: '玉铉在上，刚柔节也。' }
      ]
    };

    this.ALL_HEXAGRAMS[51] = {
      number: 51,
      name: '震',
      symbol: '䷲',
      binary: '100100',
      upperTrigram: '震',
      lowerTrigram: '震',
      meaning: '震动，惊雷，行动',
      judgment: '亨。震来虩虩，笑言哑哑。震惊百里，不丧匕鬯。',
      image: '洊雷，震。君子以恐惧修省。',
      guidance: '面临重大震动和挑战。保持冷静，化危为机，获得成长。',
      career: '事业面临重大变化，保持镇定，化挑战为机遇。',
      relationship: '关系经历震荡，需要冷静处理，增进理解。',
      keyMessage: '化危为机',
      actionAdvice: '保持冷静，获得成长',
      philosophy: '雷声重叠，象征震动。君子应因恐惧而修身反省。',
      lines: [
        { type: 'yang', text: '震来虩虩，后笑言哑哑，吉。', image: '震来虩虩，恐致福也。笑言哑哑，后有则也。' },
        { type: 'yin', text: '震来厉，亿丧贝，跻于九陵，勿逐，七日得。', image: '震来厉，乘刚也。' },
        { type: 'yin', text: '震苏苏，震行无眚。', image: '震苏苏，位不当也。' },
        { type: 'yin', text: '震遂泥。', image: '震遂泥，未光也。' },
        { type: 'yin', text: '震往来厉，亿无丧，有事。', image: '震往来厉，危行也。其事在中，大无丧也。' },
        { type: 'yin', text: '震索索，视矍矍，征凶。震不于其躬，于其邻，无咎。婚媾有言。', image: '震索索，中未得也。虽凶无咎，畏邻戒也。' }
      ]
    };

    this.ALL_HEXAGRAMS[52] = {
      number: 52,
      name: '艮',
      symbol: '䷳',
      binary: '001001',
      upperTrigram: '艮',
      lowerTrigram: '艮',
      meaning: '艮止，停止，静止',
      judgment: '艮其背，不获其身，行其庭，不见其人，无咎。',
      image: '兼山，艮。君子以思不出其位。',
      guidance: '需要停止和反思的时期。适可而止，保持内心平静。',
      career: '事业需要暂停调整，避免过度扩张，保持稳健。',
      relationship: '关系需要冷静期，给彼此空间，避免冲突。',
      keyMessage: '适可而止',
      actionAdvice: '保持平静，避免冲动',
      philosophy: '两山重叠，象征停止。君子思考不超越本位。',
      lines: [
        { type: 'yin', text: '艮其趾，无咎，利永贞。', image: '艮其趾，未失正也。' },
        { type: 'yin', text: '艮其腓，不拯其随，其心不快。', image: '不拯其随，未退听也。' },
        { type: 'yang', text: '艮其限，列其夤，厉薰心。', image: '艮其限，危薰心也。' },
        { type: 'yin', text: '艮其身，无咎。', image: '艮其身，止诸躬也。' },
        { type: 'yin', text: '艮其辅，言有序，悔亡。', image: '艮其辅，以中正也。' },
        { type: 'yang', text: '敦艮，吉。', image: '敦艮之吉，以厚终也。' }
      ]
    };

    this.ALL_HEXAGRAMS[53] = {
      number: 53,
      name: '渐',
      symbol: '䷴',
      binary: '001011',
      upperTrigram: '巽',
      lowerTrigram: '艮',
      meaning: '渐进，逐步，循序渐进',
      judgment: '女归吉，利贞。',
      image: '山上有木，渐。君子以居贤德，善俗。',
      guidance: '循序渐进发展的时期。稳步前进，终将达成目标。',
      career: '事业需要循序渐进，稳步发展，避免急躁。',
      relationship: '关系需要慢慢培养，循序渐进，建立深厚感情。',
      keyMessage: '循序渐进',
      actionAdvice: '稳步前进，终达目标',
      philosophy: '山上生木，象征渐进。君子应居守贤德，改善风俗。',
      lines: [
        { type: 'yin', text: '鸿渐于干，小子厉，有言，无咎。', image: '小子之厉，义无咎也。' },
        { type: 'yin', text: '鸿渐于磐，饮食衎衎，吉。', image: '饮食衎衎，不素饱也。' },
        { type: 'yang', text: '鸿渐于陆，夫征不复，妇孕不育，凶。利御寇。', image: '夫征不复，离群丑也。妇孕不育，失其道也。利用御寇，顺相保也。' },
        { type: 'yin', text: '鸿渐于木，或得其桷，无咎。', image: '或得其桷，顺以巽也。' },
        { type: 'yang', text: '鸿渐于陵，妇三岁不孕，终莫之胜，吉。', image: '终莫之胜，吉，得所愿也。' },
        { type: 'yang', text: '鸿渐于逵，其羽可用为仪，吉。', image: '其羽可用为仪，吉，不可乱也。' }
      ]
    };

    this.ALL_HEXAGRAMS[54] = {
      number: 54,
      name: '归妹',
      symbol: '䷵',
      binary: '110100',
      upperTrigram: '震',
      lowerTrigram: '兑',
      meaning: '归妹，嫁女，归宿',
      judgment: '征凶，无攸利。',
      image: '泽上有雷，归妹。君子以永终知敝。',
      guidance: '关注归宿和结果的时期。谨慎处理终身大事，避免草率。',
      career: '事业需要谨慎决策，避免草率行动导致不利后果。',
      relationship: '关系涉及终身大事，需要慎重考虑，避免冲动。',
      keyMessage: '谨慎归宿',
      actionAdvice: '慎重决策，避免草率',
      philosophy: '泽上有雷，象征嫁女。君子应知永恒终结之理。',
      lines: [
        { type: 'yang', text: '归妹以娣，跛能履，征吉。', image: '归妹以娣，以恒也。跛能履，吉相承也。' },
        { type: 'yang', text: '眇能视，利幽人之贞。', image: '利幽人之贞，未变常也。' },
        { type: 'yin', text: '归妹以须，反归以娣。', image: '归妹以须，未当也。' },
        { type: 'yang', text: '归妹愆期，迟归有时。', image: '愆期之志，有待而行也。' },
        { type: 'yin', text: '帝乙归妹，其君之袂，不如其娣之袂良，月几望，吉。', image: '帝乙归妹，不如其娣之袂良也。其位在中，以贵行也。' },
        { type: 'yin', text: '女承筐无实，士刲羊无血，无攸利。', image: '上六无实，承虚筐也。' }
      ]
    };

    this.ALL_HEXAGRAMS[55] = {
      number: 55,
      name: '丰',
      symbol: '䷶',
      binary: '101100',
      upperTrigram: '震',
      lowerTrigram: '离',
      meaning: '丰盛，盛大，丰富',
      judgment: '亨，王假之，勿忧，宜日中。',
      image: '雷电皆至，丰。君子以折狱致刑。',
      guidance: '事业丰盛盛大的时期。保持中正，避免过度，才能长久。',
      career: '事业达到丰盛期，需要保持谦逊，避免骄傲自满。',
      relationship: '关系丰盛美满，需要珍惜维护，避免过度。',
      keyMessage: '保持中正',
      actionAdvice: '珍惜丰盛，避免过度',
      philosophy: '雷电俱至，象征丰盛。君子应断案用刑。',
      lines: [
        { type: 'yang', text: '遇其配主，虽旬无咎，往有尚。', image: '虽旬无咎，过旬灾也。' },
        { type: 'yin', text: '丰其蔀，日中见斗，往得疑疾，有孚发若，吉。', image: '有孚发若，信以发志也。' },
        { type: 'yang', text: '丰其沛，日中见沫，折其右肱，无咎。', image: '丰其沛，不可大事也。折其右肱，终不可用也。' },
        { type: 'yang', text: '丰其蔀，日中见斗，遇其夷主，吉。', image: '丰其蔀，位不当也。日中见斗，幽不明也。遇其夷主，吉，行也。' },
        { type: 'yin', text: '来章，有庆誉，吉。', image: '六五之吉，有庆也。' },
        { type: 'yin', text: '丰其屋，蔀其家，窥其户，阒其无人，三岁不觌，凶。', image: '丰其屋，天际翔也。窥其户，阒其无人，自藏也。' }
      ]
    };

    this.ALL_HEXAGRAMS[56] = {
      number: 56,
      name: '旅',
      symbol: '䷷',
      binary: '101001',
      upperTrigram: '离',
      lowerTrigram: '艮',
      meaning: '旅行，旅居，漂泊',
      judgment: '小亨，旅贞吉。',
      image: '山上有火，旅。君子以明慎用刑，而不留狱。',
      guidance: '处于旅行或漂泊的时期。保持谨慎，适应环境，终将安定。',
      career: '事业处于变动期，需要适应新环境，保持谨慎。',
      relationship: '关系处于不稳定期，需要相互理解，共同适应。',
      keyMessage: '适应环境',
      actionAdvice: '保持谨慎，终将安定',
      philosophy: '山上有火，象征旅行。君子应明慎用刑，不留狱讼。',
      lines: [
        { type: 'yin', text: '旅琐琐，斯其所取灾。', image: '旅琐琐，志穷灾也。' },
        { type: 'yin', text: '旅即次，怀其资，得童仆贞。', image: '得童仆贞，终无尤也。' },
        { type: 'yang', text: '旅焚其次，丧其童仆，贞厉。', image: '旅焚其次，亦以伤矣。以旅与下，其义丧也。' },
        { type: 'yang', text: '旅于处，得其资斧，我心不快。', image: '旅于处，未得位也。得其资斧，心未快也。' },
        { type: 'yin', text: '射雉一矢亡，终以誉命。', image: '终以誉命，上逮也。' },
        { type: 'yang', text: '鸟焚其巢，旅人先笑后号咷。丧牛于易，凶。', image: '以旅在上，其义焚也。丧牛于易，终莫之闻也。' }
      ]
    };

    this.ALL_HEXAGRAMS[57] = {
      number: 57,
      name: '巽',
      symbol: '䷸',
      binary: '110110',
      upperTrigram: '巽',
      lowerTrigram: '巽',
      meaning: '巽顺，顺从，谦逊',
      judgment: '小亨，利攸往，利见大人。',
      image: '随风，巽。君子以申命行事。',
      guidance: '以谦逊柔顺的态度行事。顺应时势，将获得顺利发展。',
      career: '事业需要谦逊态度，顺应时势，获得发展机会。',
      relationship: '关系需要谦逊包容，相互理解，增进和谐。',
      keyMessage: '谦逊柔顺',
      actionAdvice: '顺应时势，获得发展',
      philosophy: '风相随，象征顺从。君子应重申命令，推行政事。',
      lines: [
        { type: 'yin', text: '进退，利武人之贞。', image: '进退，志疑也。利武人之贞，志治也。' },
        { type: 'yang', text: '巽在床下，用史巫纷若，吉，无咎。', image: '纷若之吉，得中也。' },
        { type: 'yang', text: '频巽，吝。', image: '频巽之吝，志穷也。' },
        { type: 'yin', text: '悔亡，田获三品。', image: '田获三品，有功也。' },
        { type: 'yang', text: '贞吉悔亡，无不利。无初有终，先庚三日，后庚三日，吉。', image: '九五之吉，位正中也。' },
        { type: 'yin', text: '巽在床下，丧其资斧，贞凶。', image: '巽在床下，上穷也。丧其资斧，正乎凶也。' }
      ]
    };

    this.ALL_HEXAGRAMS[58] = {
      number: 58,
      name: '兑',
      symbol: '䷹',
      binary: '110011',
      upperTrigram: '兑',
      lowerTrigram: '兑',
      meaning: '兑悦，喜悦，和悦',
      judgment: '亨，利贞。',
      image: '丽泽，兑。君子以朋友讲习。',
      guidance: '充满喜悦和和谐的氛围。保持和悦态度，增进人际和谐。',
      career: '事业处于和谐期，保持愉悦心情，促进团队合作。',
      relationship: '关系和谐美满，保持喜悦心情，增进感情。',
      keyMessage: '喜悦和谐',
      actionAdvice: '保持和悦，增进和谐',
      philosophy: '两泽相连，象征喜悦。君子应与朋友讲习道义。',
      lines: [
        { type: 'yang', text: '和兑，吉。', image: '和兑之吉，行未疑也。' },
        { type: 'yang', text: '孚兑，吉，悔亡。', image: '孚兑之吉，信志也。' },
        { type: 'yin', text: '来兑，凶。', image: '来兑之凶，位不当也。' },
        { type: 'yang', text: '商兑，未宁，介疾有喜。', image: '九四之喜，有庆也。' },
        { type: 'yin', text: '孚于剥，有厉。', image: '孚于剥，位正当也。' },
        { type: 'yang', text: '引兑。', image: '上六引兑，未光也。' }
      ]
    };

    this.ALL_HEXAGRAMS[59] = {
      number: 59,
      name: '涣',
      symbol: '䷺',
      binary: '010011',
      upperTrigram: '巽',
      lowerTrigram: '坎',
      meaning: '涣散，离散，化解',
      judgment: '亨。王假有庙，利涉大川，利贞。',
      image: '风行水上，涣。先王以享于帝立庙。',
      guidance: '化解涣散，重建秩序的时期。凝聚人心，重获团结。',
      career: '团队出现涣散，需要重建凝聚力，恢复秩序。',
      relationship: '关系出现疏离，需要沟通理解，重建联系。',
      keyMessage: '化解涣散',
      actionAdvice: '凝聚人心，重建团结',
      philosophy: '风行水上，象征涣散。先王享祭上帝，建立宗庙。',
      lines: [
        { type: 'yin', text: '用拯马壮，吉。', image: '初六之吉，顺也。' },
        { type: 'yang', text: '涣奔其机，悔亡。', image: '涣奔其机，得愿也。' },
        { type: 'yin', text: '涣其躬，无悔。', image: '涣其躬，志在外也。' },
        { type: 'yin', text: '涣其群，元吉。涣有丘，匪夷所思。', image: '涣其群，元吉，光大也。' },
        { type: 'yang', text: '涣汗其大号，涣王居，无咎。', image: '王居无咎，正位也。' },
        { type: 'yang', text: '涣其血，去逖出，无咎。', image: '涣其血，远害也。' }
      ]
    };

    this.ALL_HEXAGRAMS[60] = {
      number: 60,
      name: '节',
      symbol: '䷻',
      binary: '110010',
      upperTrigram: '坎',
      lowerTrigram: '兑',
      meaning: '节制，节约，适度',
      judgment: '亨。苦节，不可贞。',
      image: '泽上有水，节。君子以制数度，议德行。',
      guidance: '需要节制和适度的时期。合理控制，避免过度，保持平衡。',
      career: '事业需要合理规划，节制资源，避免浪费。',
      relationship: '关系需要适度控制，给彼此空间，保持平衡。',
      keyMessage: '合理节制',
      actionAdvice: '适度控制，保持平衡',
      philosophy: '泽上有水，象征节制。君子应制定法度，评议德行。',
      lines: [
        { type: 'yin', text: '不出户庭，无咎。', image: '不出户庭，知通塞也。' },
        { type: 'yang', text: '不出门庭，凶。', image: '不出门庭，失时极也。' },
        { type: 'yin', text: '不节若，则嗟若，无咎。', image: '不节之嗟，又谁咎也。' },
        { type: 'yang', text: '安节，亨。', image: '安节之亨，承上道也。' },
        { type: 'yang', text: '甘节，吉，往有尚。', image: '甘节之吉，居位中也。' },
        { type: 'yin', text: '苦节，贞凶，悔亡。', image: '苦节贞凶，其道穷也。' }
      ]
    };

    this.ALL_HEXAGRAMS[61] = {
      number: 61,
      name: '中孚',
      symbol: '䷼',
      binary: '110011',
      upperTrigram: '巽',
      lowerTrigram: '兑',
      meaning: '中孚，诚信，内心诚实',
      judgment: '豚鱼吉，利涉大川，利贞。',
      image: '泽上有风，中孚。君子以议狱缓死。',
      guidance: '以诚信为本的时期。内心诚实，将获得信任和成功。',
      career: '事业以诚信为本，建立信誉，获得成功。',
      relationship: '关系以诚信为基础，建立深厚信任。',
      keyMessage: '诚信为本',
      actionAdvice: '内心诚实，建立信任',
      philosophy: '泽上有风，象征诚信。君子应审议案件，宽缓死刑。',
      lines: [
        { type: 'yang', text: '虞吉，有它不燕。', image: '初九虞吉，志未变也。' },
        { type: 'yang', text: '鸣鹤在阴，其子和之。我有好爵，吾与尔靡之。', image: '其子和之，中心愿也。' },
        { type: 'yin', text: '得敌，或鼓或罢，或泣或歌。', image: '或鼓或罢，位不当也。' },
        { type: 'yang', text: '月几望，马匹亡，无咎。', image: '马匹亡，绝类上也。' },
        { type: 'yang', text: '有孚挛如，无咎。', image: '有孚挛如，位正当也。' },
        { type: 'yin', text: '翰音登于天，贞凶。', image: '翰音登于天，何可长也。' }
      ]
    };

    this.ALL_HEXAGRAMS[62] = {
      number: 62,
      name: '小过',
      symbol: '䷽',
      binary: '001100',
      upperTrigram: '震',
      lowerTrigram: '艮',
      meaning: '小过，小有过失，过度',
      judgment: '亨，利贞。可小事，不可大事。飞鸟遗之音，不宜上宜下，大吉。',
      image: '山上有雷，小过。君子以行过乎恭，丧过乎哀，用过乎俭。',
      guidance: '小有过失的时期。谨慎行事，避免大错，小处改进。',
      career: '事业中可能出现小失误，及时调整，避免扩大。',
      relationship: '关系中小有摩擦，及时化解，增进理解。',
      keyMessage: '谨慎小过',
      actionAdvice: '小处改进，避免大错',
      philosophy: '山上有雷，象征小过。君子行为过于恭谨，丧事过于哀痛，用度过于节俭。',
      lines: [
        { type: 'yin', text: '飞鸟以凶。', image: '飞鸟以凶，不可如何也。' },
        { type: 'yin', text: '过其祖，遇其妣，不及其君，遇其臣，无咎。', image: '不及其君，臣不可过也。' },
        { type: 'yang', text: '弗过防之，从或戕之，凶。', image: '从或戕之，凶如何也。' },
        { type: 'yang', text: '无咎，弗过遇之。往厉必戒，勿用永贞。', image: '弗过遇之，位不当也。往厉必戒，终不可长也。' },
        { type: 'yin', text: '密云不雨，自我西郊，公弋取彼在穴。', image: '密云不雨，已上也。' },
        { type: 'yin', text: '弗遇过之，飞鸟离之，凶，是谓灾眚。', image: '弗遇过之，已亢也。' }
      ]
    };

    this.ALL_HEXAGRAMS[63] = {
      number: 63,
      name: '既济',
      symbol: '䷾',
      binary: '101010',
      upperTrigram: '坎',
      lowerTrigram: '离',
      meaning: '既济，完成，成功',
      judgment: '亨，小利贞，初吉终乱。',
      image: '水在火上，既济。君子以思患而豫防之。',
      guidance: '事情已经完成的时期。居安思危，预防未然，保持成果。',
      career: '事业已经取得成功，需要防范风险，保持成果。',
      relationship: '关系已经稳定，需要维护感情，预防问题。',
      keyMessage: '居安思危',
      actionAdvice: '预防未然，保持成果',
      philosophy: '水在火上，象征完成。君子应思患而预防。',
      lines: [
        { type: 'yang', text: '曳其轮，濡其尾，无咎。', image: '曳其轮，义无咎也。' },
        { type: 'yin', text: '妇丧其茀，勿逐，七日得。', image: '七日得，以中道也。' },
        { type: 'yang', text: '高宗伐鬼方，三年克之，小人勿用。', image: '三年克之，惫也。' },
        { type: 'yin', text: '繻有衣袽，终日戒。', image: '终日戒，有所疑也。' },
        { type: 'yang', text: '东邻杀牛，不如西邻之禴祭，实受其福。', image: '东邻杀牛，不如西邻之时也。实受其福，吉大来也。' },
        { type: 'yin', text: '濡其首，厉。', image: '濡其首厉，何可久也。' }
      ]
    };

    this.ALL_HEXAGRAMS[64] = {
      number: 64,
      name: '未济',
      symbol: '䷿',
      binary: '101010',
      upperTrigram: '离',
      lowerTrigram: '坎',
      meaning: '尚未完成，过渡，混乱',
      judgment: '亨。小狐汔济，濡其尾，无攸利。',
      image: '火在水上，未济。君子以慎辨物居方。',
      guidance: '事情尚未完成，处于过渡阶段。需要非常谨慎，仔细辨别情况，不要急于求成，否则可能功亏一篑。',
      career: '项目或任务接近尾声，但仍有风险。必须保持警惕，仔细检查细节，确保万无一失。',
      relationship: '关系处于一个不确定的过渡期。需要谨慎沟通，明确方向，才能进入下一个阶段。',
      keyMessage: '功亏一篑前的谨慎',
      actionAdvice: '谨慎辨别，三思而后行',
      philosophy: '事物在完成前充满变数，君子应谨慎分辨，找准自己的位置。',
      lines: [
        { type: 'yin', text: '濡其尾，吝。', image: '亦不知极也。' },
        { type: 'yang', text: '曳其轮，贞吉。', image: '中以行正也。' },
        { type: 'yin', text: '未济，征凶，利涉大川。', image: '未济征凶，位不当也。' },
        { type: 'yang', text: '贞吉，悔亡。震用伐鬼方，三年有赏于大国。', image: '贞吉悔亡，志行也。' },
        { type: 'yin', text: '贞吉，无悔。君子之光，有孚，吉。', image: '君子之光，其晖吉也。' },
        { type: 'yang', text: '有孚于饮酒，无咎。濡其首，有孚失是。', image: '饮酒濡首，亦不知节也。' }
      ]
    };
  }
}

module.exports = YijingAnalyzer;