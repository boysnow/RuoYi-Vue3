<template>
   <div class="app-container">
      <el-row :gutter="10" class="mb8">
         <el-col :span="1.5">
            <el-button
               type="primary"
               plain
               icon="Plus"
               @click="handleAdd"
               v-hasPermi="['aucper:bid:add']"
            >新規</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="success"
               plain
               icon="Edit"
               :disabled="single"
               @click="handleUpdate"
               v-hasPermi="['aucper:bid:edit']"
            >変更</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button
               type="danger"
               plain
               icon="Delete"
               :disabled="multiple"
               @click="handleDelete"
               v-hasPermi="['aucper:bid:remove']"
            >削除</el-button>
         </el-col>
         <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>
      <el-table
         v-loading="loading"
         :data="dataList"
         style="width: 100%;"
         :cell-class-name="changeBgColor"
         :row-style="rowBgColor"
      >
        <el-table-column label="#" width="50" type="index" align="center">
            <template #default="scope">
               <span>{{ scope.$index + 1 }}</span>
            </template>
        </el-table-column>
        <el-table-column label="商品コード" align="center" width="120" prop="productCode" />
        <el-table-column label="タイトル" align="center" width="400" prop="productTitle" :show-overflow-tooltip="true" >
            <template #default="scope">
                <a :href="baseUrl + scope.row.productCode" target="_blank">{{ scope.row.productTitle }}</a>
            </template>
        </el-table-column>
        <el-table-column label="現在価格" align="center" width="100" prop="nowPrice"  >
            <template #default="scope">
                <span style="font-weight: bold;">{{ scope.row.nowPrice }}</span>
            </template>
        </el-table-column>
        <el-table-column label="保留価格" align="center" width="100" prop="onholdPrice" />
        <el-table-column label="入札数" align="center" width="65" prop="bidUserCount" />
        <el-table-column label="入札終了日時" align="center" width="120" prop="bidEndDate" :show-overflow-tooltip="true" >
            <template #default="scope">
                <span>{{ parseTime(scope.row.bidEndDate, '{m}-{d} {h}:{i}') }}</span>
            </template>
        </el-table-column>
        <el-table-column label="残り時間" align="center" width="100" prop="remainingTime">
            <template #default="scope">
                <span v-if="scope.row.remainingTimeUnit != '-'" style="font-weight: bold;">{{ scope.row.remainingTime }}</span>
                <span >{{ scope.row.remainingTimeUnit }}</span>
            </template>
        </el-table-column>
        <el-table-column label="ステータス" align="center" width="100" prop="realStatus" >
            <template #default="scope">
               <dict-tag :options="auc_real_status" :value="scope.row.realStatus" />
            </template>
        </el-table-column>
        <el-table-column label="最後入札者" align="center" prop="bidLastUser"/>
        <el-table-column label="托管ユーザ１" align="center" prop="trusteeshipUser1" :show-overflow-tooltip="true" />
        <el-table-column label="托管ユーザ２" align="center" prop="trusteeshipUser2" :show-overflow-tooltip="true" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
            <template #default="scope">
               <el-tooltip content="変更" placement="top">
                  <el-button
                     type="text"
                     icon="Edit"
                     @click="handleUpdate(scope.row)"
                     v-hasPermi="['monitor:job:edit']"
                  ></el-button>
               </el-tooltip>
               <el-tooltip content="削除" placement="top">
                  <el-button
                     type="text"
                     icon="Delete"
                     @click="handleDelete(scope.row)"
                     v-hasPermi="['monitor:job:remove']"
                  ></el-button>
               </el-tooltip>
               <el-tooltip content="最新情報取得" placement="top">
                  <el-button
                     type="text"
                     icon="CaretRight"
                     @click="handleRun(scope.row)"
                     v-hasPermi="['monitor:job:changeStatus']"
                  ></el-button>
               </el-tooltip>
            </template>
        </el-table-column>
      </el-table>


      <!-- 添加或修改公告对话框 -->
      <el-dialog :title="title" v-model="open" width="600px" append-to-body>
         <el-form ref="bidRef" :model="form" :rules="rules" label-width="100px">
            <el-row>
               <el-col :span="24">
                  <el-form-item label="ID/URL" prop="productCode">
                     <el-input v-model="form.productCode" placeholder="オークションID or URL" id="productCode" :disabled="isEdit"/>
                  </el-form-item>
               </el-col>
            </el-row>
            <el-row>
               <el-col :span="24">
                  <el-form-item label="区分">
                     <el-radio-group v-model="form.taskKind">
                        <el-radio
                           v-for="dict in auc_task_kind"
                           :key="dict.value"
                           :label="dict.value"
                        >{{ dict.label }}</el-radio>
                     </el-radio-group>
                  </el-form-item>
               </el-col>
            </el-row>
            <el-row>
               <el-col :span="12">
                  <el-form-item label="入札上限価格" prop="onholdPrice">
                     <el-input v-model="form.onholdPrice" placeholder="入札上限価格" />
                  </el-form-item>
               </el-col>
            </el-row>
            <el-row>
               <el-col :span="12">
                  <el-form-item label="入札ユーザ１" prop="trusteeshipUser1">
                     <el-input v-model="form.trusteeshipUser1" placeholder="入札ユーザ１" />
                  </el-form-item>
               </el-col>
               <el-col :span="12">
                  <el-form-item label="入札ユーザ２" prop="trusteeshipUser2">
                     <el-input v-model="form.trusteeshipUser2" placeholder="入札ユーザ２" />
                  </el-form-item>
               </el-col>
            </el-row>
         </el-form>
         <template #footer>
            <div class="dialog-footer">
               <el-button type="primary" @click="submitForm">確定</el-button>
               <el-button @click="cancel">取消</el-button>
            </div>
         </template>
      </el-dialog>


   </div>
</template>

<script setup name="Bid">
import { listBid as initData, getBid, updateBid, addBid, delBid, getBidConfig } from "@/api/aucper/bid";

const { proxy } = getCurrentInstance();
const { auc_real_status, auc_task_kind } = proxy.useDict("auc_real_status", "auc_task_kind");

const dataList = ref([]);
const loading = ref(true);
const codes = ref([]);
const total = ref(0);
const open = ref(false);
const title = ref("");
const baseUrl = ref("");
const isEdit = ref(false);

const data = reactive({
  form: {},
  queryParams: {
    productCode: undefined,
    taskKind: undefined
  },
  rules: {
    productCode: [{ required: true, message: "ID or URLが必須です", trigger: "blur" }],
    taskKind: [{ required: true, message: "ID or URLが必須です", trigger: "change" }]
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询登录日志列表 */
function getList() {
//   loading.value = true;
  initData(queryParams.value).then(response => {
    // 値が変化あるかチェック
    let beforeData = dataList.value;
    dataList.value = response.rows;
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
        newrow.bidUserCount_changed = true;
        newrow.bidEndDate_changed = true;
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
            if (oldrow.bidUserCount === newrow.bidUserCount) {
                newrow.bidUserCount_changed = false;
            }
            if (oldrow.bidEndDate === newrow.bidEndDate) {
                newrow.bidEndDate_changed = false;
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


    total.value = response.total;
    loading.value = false;
  });
}

function getConfig() {
    getBidConfig().then(response => {
        baseUrl.value = response.data.baseUrl;
    });
}
/** 搜索按钮操作 */
function handleQuery() {
//   queryParams.value.pageNum = 1;
  getList();
}
/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

function reset() {
  form.value = {
      taskKind: '0'
  };
  proxy.resetForm("bidRef");
}

function handleAdd() {
  reset();
  open.value = true;
  title.value = "新規登録";
  isEdit.value = false;
    setTimeout(() => {
        document.getElementById("productCode").focus();
    }, 200);
}

function handleUpdate(row) {
  reset();
  const code = row.productCode || codes.value;
  getBid(code).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "変更";
    isEdit.value = true;
  });
}

function handleDelete(row) {
  const codes = row.productCode;
  proxy.$modal.confirm('削除しますが、よろしいですか？').then(function () {
    return delBid(codes);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("削除しました");
  }).catch(() => {});
}
function submitForm() {
  proxy.$refs["bidRef"].validate(valid => {
    if (valid) {
      //auctionIDがURLの場合、編集しておく
      form.value.productCode = form.value.productCode.replace(/\/$/, "").replace(/.*\//g, "");
      if (form.value.updateTime != undefined) {
        updateBid(form.value).then(response => {
          proxy.$modal.msgSuccess("保存しました");
          open.value = false;
          getList();
        });
      } else {
        addBid(form.value).then(response => {
          proxy.$modal.msgSuccess("保存しました");
          open.value = false;
          getList();
        });
      }
    }
  });
}
function cancel() {
  open.value = false;
  reset();
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

getConfig();
getList();

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
    if (column.property === "bidUserCount") {
        if (row.bidUserCount_changed) return "animate-red-bg";
    }
    if (column.property === "bidEndDate") {
        if (row.bidEndDate_changed) return "animate-red-bg";
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

function rowBgColor({row, rowIndex}) {
    if (row.bidStatus === "2") {
        return "background-color: silver";
    }
}

onUnmounted(() => {
   clearInterval(timerId);
})


</script>
