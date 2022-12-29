import { Controller } from "stimulus";
import { fetchWithParamsAndRedirect } from "../../lib/fetcher";

export default class extends Controller {
  connect() {
    const token = document.querySelector("meta[name='csrf-token']").content;
    const cinemaId = this.element.dataset.cinemaId;

    fetch(`/admin/cinemas/${cinemaId}/seats/edit.json`, {
      method: "GET",
      headers: {
        "X-csrf-Token": token,
      },
    })
      .then((resp) => {
        return resp.json();
      })
      .then(({ seatList }) => {
        this.seatList = seatList;

        this.maxRow = this.seatList.length;
        this.maxColumn = this.seatList[0].length;

        this.makeSeatingChart(this.seatList, this.maxRow, this.maxColumn);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  makeSeatingChart(seats, row, column) {
    const grid = this.element.firstElementChild;
    grid.style.cssText += `grid-template-rows: repeat(${row}, 1fr);grid-template-columns: repeat(${column + 2}, 1fr);`;

    let seatItems = "";
    for (var r = 0; r < row; r++) {
      let RowId = `<div class="text-center">${String.fromCharCode(r + 65)}</div>`;
      seatItems += RowId;
      for (let c = 0; c < column; c++) {
        let columnId = `<div class="seat-item" data-row-id=${r} data-column-id=${c} data-status="added" data-action="click->admin--seats--edit-seats#changeSeatStatus">${String(c + 1).padStart(2, "0")}</div>`;

        if (seats[r][c] == 0) {
          columnId = `<div class="seat-item bg-transparent" data-row-id=${r} data-column-id=${c} data-status="not added" data-action="click->admin--seats--edit-seats#changeSeatStatus">${String(c + 1).padStart(2, "0")}</div>`;
        }

        seatItems += columnId;
      }
      seatItems += RowId;
    }
    grid.insertAdjacentHTML("beforeend", seatItems);
  }

  changeSeatStatus(el) {
    const rowId = +el.target.dataset.rowId;
    const columnId = +el.target.dataset.columnId;
    let seatStatus = el.target.dataset.status;

    switch (seatStatus) {
      case "not added":
        el.target.classList.remove("bg-transparent", "text-dark");

        el.target.dataset.status = "added";

        this.seatList[rowId][columnId] = 1;
        break;
      case "added":
        el.target.classList.add("bg-transparent", "text-dark");

        el.target.dataset.status = "not added";

        this.seatList[rowId][columnId] = 0;
        break;
      default:
        console.log("We don't have the seat status");
    }
  }

  updateToTable() {
    const cinemaId = this.element.dataset.id;
    const path = `/admin/cinemas/${cinemaId}/seats`;

    const seats = { seat_list: this.seatList };

    fetchWithParamsAndRedirect(path, "PATCH", seats).catch((err) => {
      console.log(err);
    });
  }
}
