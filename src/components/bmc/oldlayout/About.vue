<template>
  <div style="position: relative; width: 100%">
    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0">
      <v-row>
        <v-col cols="12" md="6" offset-md="3">
          <v-alert type="error">
            Embed blocked by ad-block:
            <v-btn
              href="//feedback.userreport.com/1ee24ff8-1aef-4308-bd32-dee0f3da0f96/"
              target="_blank"
              >Open support forum</v-btn
            >
          </v-alert>
        </v-col>
      </v-row>
      <iframe
        id="userreport-forum"
        frameborder="0"
        src="//feedback.userreport.com/1ee24ff8-1aef-4308-bd32-dee0f3da0f96/"
      ></iframe>
    </div>
  </div>
</template>

<script>
export default {};
</script>

<style>
#userreport-forum {
  border: 0px none;
  padding: 0px;
  max-width: none;
  display: block;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  background-color: #fafafa;
}
</style>
