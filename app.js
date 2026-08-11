new Vue({
  el: '#app',
  data() {
    return {
      alertMessage: '',
      memberList: MEMBER_LIST,
      selectedMemberId: '',
      selectedAttendance: 'both',
      
      newMemberName: '',
      newMemberGrade: 'high',

      newCar: {
        driver: '',
        capacity: 5
      },

settings: {
        maxCars: 0,
        date: '',
        meetingTime: '',  // 🆕 集合時間
        meetingPlace: '', // 🆕 集合場所
        summary: '',     // 🆕 概要（大会名・イベント名）
        destination: '', // 行き先（会場）
        memo: ''
      },
      cars: [],
      members: []
    }
  },
  computed: {
    unrespondedMembers() {
      return this.memberList.filter(m => {
        return !this.members.some(added => added.id === m.id);
      });
    },
    selectedCars() {
      if (!this.settings.maxCars || this.settings.maxCars <= 0) {
        return this.cars;
      }
      return this.cars.slice(0, this.settings.maxCars);
    },
    passengersNeedingRide() {
      return this.members.filter(m => {
        const isDriver = this.selectedCars.some(car => car.driver === m.name);
        return m.attendance !== 'absent' && m.attendance !== 'self' && !isDriver;
      });
    },
    unassignedMembers() {
      return this.passengersNeedingRide.filter(m => m.assignedCarId === null);
    }
  },
  created() {
    const savedCars = localStorage.getItem('noriai_cars');
    if (savedCars) {
      this.cars = JSON.parse(savedCars);
      // 古いローカルストレージデータに cost がない場合の補正
      this.cars.forEach(car => {
        if (car.cost === undefined) Vue.set(car, 'cost', 0);
      });
    } else {
      this.cars = INITIAL_CARS;
    }

    const savedMembers = localStorage.getItem('noriai_members');
    if (savedMembers) {
      this.members = JSON.parse(savedMembers);
    } else {
      this.members = INITIAL_MEMBERS;
    }

    const savedSettings = localStorage.getItem('noriai_settings');
    if (savedSettings) {
      this.settings = JSON.parse(savedSettings);
    }
  },
  methods: {
   // 💡 交通費の精算ロジック（運転手:0円 / 大人・監督:0円 / 往復:1.0 / 片道:0.5）
    calculatePerPersonCost(car, attendanceType = 'both') {
      if (!car.cost || car.cost <= 0) return 0;

      const passengers = this.getPassengersInCar(car.id);
      if (passengers.length === 0) return 0;

      // 負担対象となる子ども同乗者だけの合計重みポイントを算出（大人は重み0）
      const totalWeight = passengers.reduce((sum, p) => {
        if (p.grade === 'adult') return sum; // 大人/監督/コーチは負担なし(0円)
        const weight = (p.attendance === 'both') ? 1.0 : 0.5;
        return sum + weight;
      }, 0);

      // 負担対象者がいない（全員大人など）場合は0円
      if (totalWeight === 0) return 0;

      // 1ポイントあたりの単価
      const baseUnitCost = car.cost / totalWeight;

      // 指定された乗車タイプ（往復:1.0 / 片道:0.5）の負担額を計算（10円単位切り上げ）
      const multiplier = (attendanceType === 'both') ? 1.0 : 0.5;
      const rawCost = baseUnitCost * multiplier;

      return Math.ceil(rawCost / 10) * 10;
    },

    addMemberFromList() {
      if (!this.selectedMemberId) {
        alert('メンバーを選択してください。');
        return;
      }

      const target = this.memberList.find(m => m.id === Number(this.selectedMemberId));
      if (!target) return;

      this.members.push({
        id: target.id,
        name: target.name,
        type: target.type,
        grade: target.grade,
        attendance: this.selectedAttendance,
        assignedCarId: null
      });

      this.selectedMemberId = '';
      this.selectedAttendance = 'both';

      this.saveToLocalStorage();
    },

    addNewMemberDirectly() {
      if (!this.newMemberName.trim()) {
        alert('お名前を入力してください。');
        return;
      }

      this.members.push({
        id: Date.now(),
        name: this.newMemberName.trim(),
        type: this.newMemberGrade === 'adult' ? 'adult' : 'child',
        grade: this.newMemberGrade,
        attendance: 'both',
        assignedCarId: null
      });

      this.newMemberName = '';
      this.newMemberGrade = 'high';

      this.saveToLocalStorage();
    },

    removeMember(index) {
      if (confirm('このメンバーを削除してもよろしいですか？')) {
        this.members.splice(index, 1);
        this.saveToLocalStorage();
      }
    },

    addCar() {
      if (!this.newCar.driver.trim()) {
        alert('運転手のお名前を入力してください。');
        return;
      }
      if (this.newCar.capacity < 1) {
        alert('定員は1名以上で指定してください。');
        return;
      }

      this.cars.push({
        id: Date.now(),
        driver: this.newCar.driver.trim(),
        capacity: this.newCar.capacity,
        cost: 0,
        isSelected: true
      });

      this.newCar.driver = '';
      this.newCar.capacity = 5;

      this.saveToLocalStorage();
    },

    removeCar(carId) {
      if (confirm('この車両を削除してもよろしいですか？（乗車中のメンバーは未割り当てになります）')) {
        this.members.forEach(m => {
          if (m.assignedCarId === carId) {
            m.assignedCarId = null;
          }
        });
        this.cars = this.cars.filter(c => c.id !== carId);
        this.saveToLocalStorage();
      }
    },

    getCarPassengerCount(carId) {
      const membersInCar = this.members.filter(m => m.assignedCarId === carId).length;
      return 1 + membersInCar;
    },

    getRemainingCapacity(car) {
      return car.capacity - this.getCarPassengerCount(car.id);
    },

    getPassengersInCar(carId) {
      return this.members.filter(m => m.assignedCarId === carId);
    },

    handleAttendanceChange(member) {
      if (member.attendance === 'absent' || member.attendance === 'self') {
        member.assignedCarId = null;
      }
      this.saveToLocalStorage();
    },

    manualAssign(member) {
      if (member.assignedCarId === null) return;
      const targetCar = this.selectedCars.find(c => c.id === member.assignedCarId);
      
      if (targetCar && this.getRemainingCapacity(targetCar) < 0) {
        this.alertMessage = `${targetCar.driver}の車は定員オーバーです！`;
        member.assignedCarId = null;
      } else {
        this.alertMessage = '';
        this.saveToLocalStorage();
      }
    },

    autoAssign() {
      this.alertMessage = '';
      if (this.selectedCars.length === 0) {
        this.alertMessage = '⚠️ 配車可能な車がありません。車を登録してください。';
        return;
      }

      this.members.forEach(m => m.assignedCarId = null);

      let passengers = [...this.passengersNeedingRide];
      let overflow = false;

      passengers.forEach(user => {
        const sortedCars = [...this.selectedCars].sort((a, b) => {
          return this.getRemainingCapacity(b) - this.getRemainingCapacity(a);
        });

        const targetCar = sortedCars[0];
        if (targetCar && this.getRemainingCapacity(targetCar) > 0) {
          user.assignedCarId = targetCar.id;
        } else {
          overflow = true;
        }
      });

      if (overflow) {
        this.alertMessage = '⚠️ 定員不足により、一部のメンバーを配車できませんでした。車を追加するか定員数を調整してください。';
      }
      this.saveToLocalStorage();
    },

    getAttendanceLabel(code) {
      const labels = {
        both: '往復',
        outward: '往路のみ',
        return: '復路のみ',
        self: '送迎不要',
        absent: '不参加'
      };
      return labels[code] || '';
    },

    saveToLocalStorage() {
      localStorage.setItem('noriai_cars', JSON.stringify(this.cars));
      localStorage.setItem('noriai_members', JSON.stringify(this.members));
      localStorage.setItem('noriai_settings', JSON.stringify(this.settings));
    },

// 📋 精算結果を含むLINE送信用テキストのコピー
    copyResult() {
      let text = '🚗 配車案内 \n';
      
      if (this.settings.date) text += `📅 日時: ${this.settings.date}\n`;
      if (this.settings.meetingTime) text += `⏰ 集合時間: ${this.settings.meetingTime}\n`;
      if (this.settings.meetingPlace) text += `📍 集合場所: ${this.settings.meetingPlace}\n`;
      if (this.settings.summary) text += `🚩 概要: ${this.settings.summary}\n`;      // 概要
      if (this.settings.destination) text += `🏁 行き先: ${this.settings.destination}\n`; // 🏁 行き先
      if (this.settings.memo) text += `📝 メモ: ${this.settings.memo}\n`;
      
      text += '\n--------------------\n';
      this.selectedCars.forEach((car, index) => {
        const passengers = this.getPassengersInCar(car.id).map(p => {
          const attLabel = this.getAttendanceLabel(p.attendance);
          // 大人の場合は(監督/往復/負担なし) のように明記
          // if (p.grade === 'adult') {
          //   return `${p.name}(大人/${attLabel}/負担なし)`;
          // }
          return `${p.name}(${attLabel})`;
        }).join(', ');

        const costBoth = this.calculatePerPersonCost(car, 'both');
        const costSingle = this.calculatePerPersonCost(car, 'single');

        text += `【${index + 1}台目】${car.driver}号`;
        // text += `  [運転手] ${car.driver} (0円)\n`;
        text += ` ${passengers || 'なし'}\n`;
        if (car.cost > 0) {
          text += `  [交通費合計] ${car.cost.toLocaleString()}円\n`;
          text += `  👉 精算額: 往復 1人 ${costBoth.toLocaleString()}円 / 片道 1人 ${costSingle.toLocaleString()}円\n`;
        }
        text += '\n';
      });

      navigator.clipboard.writeText(text).then(() => {
        alert('配車結果と精算金額をコピーしました！');
      });
    }
  },
  watch: {
    settings: {
      handler() {
        this.saveToLocalStorage();
      },
      deep: true
    }
  }
});