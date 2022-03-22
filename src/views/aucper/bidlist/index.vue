<template>
   <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="68px">
         <el-form-item label="登录地址" prop="ipaddr">
            <el-input
               v-model="queryParams.ipaddr"
               placeholder="请输入登录地址"
               clearable
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item label="用户名称" prop="userName">
            <el-input
               v-model="queryParams.userName"
               placeholder="请输入用户名称"
               clearable
               @keyup.enter="handleQuery"
            />
         </el-form-item>
         <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
         </el-form-item>
      </el-form>
      <el-table
         v-loading="loading"
         :data="dataList.slice((pageNum - 1) * pageSize, pageNum * pageSize)"
         style="width: 100%;"
         :cell-class-name="changeBgColor"
      >
        <!-- <template #scope="scope"> -->
         <el-table-column label="序号" width="50" type="index" align="center">
            <template #default="scope">
               <span>{{ (pageNum - 1) * pageSize + scope.$index + 1 }}</span>
            </template>
         </el-table-column>
         <el-table-column label="商品コード" align="center" prop="productCode" :show-overflow-tooltip="true" />
         <el-table-column label="タイトル" align="center" prop="productTitle" :show-overflow-tooltip="true" />
         <el-table-column label="現在価格" align="center" prop="nowPrice" :show-overflow-tooltip="true" />
         <el-table-column label="保留価格" align="center" prop="onholdPrice" :show-overflow-tooltip="true" />
         <el-table-column label="入札開始日時" align="center" prop="bidStartDate" :show-overflow-tooltip="true" />
         <el-table-column label="最後入札者" align="center" prop="bidLastUser" :show-overflow-tooltip="true" />
         <el-table-column label="托管ユーザ１" align="center" prop="trusteeshipUser1" :show-overflow-tooltip="true" />
         <el-table-column label="托管ユーザ２" align="center" prop="trusteeshipUser2" :show-overflow-tooltip="true" />
         <el-table-column label="登录时间" align="center" prop="loginTime" width="180" >
            <template #default="scope">
               <span>{{ parseTime(scope.row.loginTime) }}</span>
            </template>
         </el-table-column>
         <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
            <template #default="scope">
               <el-button
                  type="text"
                  icon="Delete"
                  @click="handleForceLogout(scope.row)"
                  v-hasPermi="['monitor:online:forceLogout']"
               >强退</el-button>
            </template>
         </el-table-column>
        <!-- </template> -->
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="pageNum" v-model:limit="pageSize" />
   </div>
</template>

<script setup name="BidList">
import { listBidlist as initData } from "@/api/aucper/bidlist";

const { proxy } = getCurrentInstance();

const dataList = ref([]);
const loading = ref(true);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);

const queryParams = ref({
  ipaddr: undefined,
  userName: undefined
});

/** 查询登录日志列表 */
function getList() {
//   loading.value = true;
  initData(queryParams.value).then(response => {
    // 値が変化あるかチェック
    let beforeData = dataList.value;
    dataList.value = response.rows;
    console.log("--------------------");
    console.log(beforeData);
    console.log(dataList.value);
    // 
    dataList.value.map(newrow => {
        // レコード特定
        let oldrow = undefined;
        beforeData.some(o => {
            if (o.productCode === newrow.productCode) {
                oldrow = o;
                return true;
            }
            return false;
        });

        newrow.productCode_changed = true;
        newrow.productTitle_changed = true;
        newrow.nowPrice_changed = true;
        newrow.onholdPrice_changed = true;
        newrow.bidStartDate_changed = true;
        newrow.bidLastUser_changed = true;
        newrow.trusteeshipUser1_changed = true;
        newrow.trusteeshipUser2_changed = true;
        newrow.loginTime_changed = true;

        if (oldrow !== undefined) {
            if (oldrow.productCode === newrow.productCode) {
                newrow.productCode_changed = false;
            }
            if (oldrow.productTitle === newrow.productTitle) {
                newrow.productTitle_changed = false;
            }
            if (oldrow.nowPrice === newrow.nowPrice) {
                newrow.nowPrice_changed = false;
            }
            if (oldrow.onholdPrice === newrow.onholdPrice) {
                newrow.onholdPrice_changed = false;
            }
            if (oldrow.bidStartDate === newrow.bidStartDate) {
                newrow.bidStartDate_changed = false;
            }
            if (oldrow.bidLastUser === newrow.bidLastUser) {
                newrow.bidLastUser_changed = false;
            }
            if (oldrow.trusteeshipUser1 === newrow.trusteeshipUser1) {
                newrow.trusteeshipUser1_changed = false;
            }
            if (oldrow.trusteeshipUser2 === newrow.trusteeshipUser2) {
                newrow.trusteeshipUser2_changed = false;
            }
            if (oldrow.loginTime === newrow.loginTime) {
                newrow.loginTime_changed = false;
            }
        }
    });
    console.log("=========================");
    console.log(dataList.value);



    total.value = response.total;
    loading.value = false;
  });
}
/** 搜索按钮操作 */
function handleQuery() {
  pageNum.value = 1;
  getList();
}
/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}
/** 强退按钮操作 */
function handleForceLogout(row) {
    proxy.$modal.confirm('是否确认强退名称为"' + row.userName + '"的用户?').then(function () {
  return forceLogout(row.tokenId);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

// getList();


let timerId = setInterval(() => {
   getList();
}, 5000);


function changeBgColor({row, column}) {
    if (column.property === "productCode") {
        if (row.productCode_changed) return "animate-red-bg";
    }
    if (column.property === "productTitle") {
        if (row.productTitle_changed) return "animate-red-bg";
    }
    if (column.property === "nowPrice") {
        if (row.nowPrice_changed) return "animate-red-bg";
    }
    if (column.property === "onholdPrice") {
        if (row.onholdPrice_changed) return "animate-red-bg";
    }
    if (column.property === "bidStartDate") {
        if (row.bidStartDate_changed) return "animate-red-bg";
    }
    if (column.property === "bidLastUser") {
        if (row.bidLastUser_changed) return "animate-red-bg";
    }
    if (column.property === "trusteeshipUser1") {
        if (row.trusteeshipUser1_changed) return "animate-red-bg";
    }
    if (column.property === "trusteeshipUser2") {
        if (row.trusteeshipUser2_changed) return "animate-red-bg";
    }
    if (column.property === "loginTime") {
        if (row.loginTime_changed) return "animate-red-bg";
    }
}

onUnmounted(() => {
   clearInterval(timerId);
})


</script>
