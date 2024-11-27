class AnimalTable {
  constructor(species, tableId, dataUrl, sortableFields, defaultSortField = "name", defaultSortDirection = "asc") {
    this.species = species;
    this.tableId = tableId;
    this.dataUrl = dataUrl;
    this.sortableFields = sortableFields;
    this.currentSort = { field: defaultSortField, direction: defaultSortDirection };
    this.data = [];
    this.init();
  }

  // Initialize the table by fetching data and rendering it
  async init() {
    await this.fetchData();
    this.renderTable();
  }

  // Fetch data from the provided URL and handle errors
  async fetchData() {
    try {
      const response = await fetch(this.dataUrl);
      if (!response.ok) throw new Error("Failed to load data");
      this.data = await response.json();
    } catch (error) {
      console.error(`Error fetching data from ${this.dataUrl}:`, error);
    }
  }

  // Render the entire table, including header and rows
  renderTable() {
    const container = document.getElementById(this.tableId);
    container.innerHTML = `
      <h2>${this.species}</h2>
      <button class="btn btn-primary mb-2" onclick="tables['${this.tableId}'].openModal()">
        Add ${this.species === "Dogs" ? "Dog" : this.species === "Big Fish" ? "Fish" : this.species}
      </button>
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Image</th>
            ${this.getHeaderCell("name", "Name")}
            ${this.getHeaderCell("size", "Size")}
            ${this.getHeaderCell("location", "Location")}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="${this.tableId}-body"></tbody>
      </table>
    `;
    this.populateRows();
  }

  // Generate a sortable table header cell
  getHeaderCell(field, label) {
    const isSortable = this.sortableFields.includes(field);
    const sortIcon = isSortable ? this.getSortIcon(field) : '';
    return `
      <th ${isSortable ? `onclick="tables['${this.tableId}'].sortTable('${field}')"` : ""}>
        ${label} ${sortIcon}
      </th>
    `;
  }

  // Get the sort icon (▲ or ▼) based on the current sort direction
  getSortIcon(field) {
    if (this.currentSort.field === field) {
      return this.currentSort.direction === "asc" ? "▲" : "▼";
    }
    return "▲"; // Default to ascending sort icon
  }

  // Populate the table body with rows
  populateRows() {
    const tbody = document.getElementById(`${this.tableId}-body`);
    tbody.innerHTML = this.data.map((animal, index) => this.createRow(animal, index)).join("");
  }

  // Generate a single row of data
  createRow(animal, index) {
    return `
      <tr>
        <td style="width:220px;">
          <img src="${animal.image}" alt="${animal.name}" class="img-thumbnail" width="250">
        </td>
        <td style="${this.getStyle()}">${animal.name}</td>
        <td>${animal.size}</td>
        <td>${animal.location}</td>
        <td>
          <button class="btn btn-warning btn-sm p-2 m-2" onclick="tables['${this.tableId}'].openModal(${index})">Edit</button>
          <button class="btn btn-danger btn-sm p-2 m-2" onclick="tables['${this.tableId}'].deleteAnimal(${index})">Delete</button>
        </td>
      </tr>
    `;
  }

  // Define styles based on the species (for special formatting)
  getStyle() {
    if (this.species === "Dogs") return "font-weight: bold;";
    if (this.species === "Big Fish") return "font-weight: bold; font-style: italic; color: blue;";
    return "";
  }

  // Sort the data based on the selected field and toggle the direction
  sortTable(field) {
    if (!this.sortableFields.includes(field)) return;

    // Toggle sort direction
    const direction = this.currentSort.field === field && this.currentSort.direction === "asc" ? "desc" : "asc";
    this.currentSort = { field, direction };

    // Sort the data based on the selected field and direction
    this.data.sort((a, b) => this.compareValues(a, b, field, direction));
    this.renderTable();
  }

  // Compare values for sorting based on field and direction
  compareValues(a, b, field, direction) {
    const valA = a[field];
    const valB = b[field];

    // Handle "size" field to sort numerically if it contains units
    if (field === "size") {
      const numA = parseFloat(valA);
      const numB = parseFloat(valB);
      return direction === "asc" ? numA - numB : numB - numA;
    }

    // For other fields (name, location), sort lexicographically
    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  }

  // Open the modal for adding or editing an animal
  openModal(index = -1) {
    const modal = new bootstrap.Modal(document.getElementById("animalModal"));
    document.getElementById("animalForm").reset();
    document.getElementById("animalIndex").value = index;

    const modalTitle = document.getElementById("animalModalLabel");
    const action = index >= 0 ? "Edit" : "Add";
    modalTitle.textContent = `${action} ${this.species}`;

    document.getElementById("animalTableId").value = this.tableId;

    if (index >= 0) {
      const animal = this.data[index];
      document.getElementById("animalName").value = animal.name;
      document.getElementById("animalSize").value = animal.size;
      document.getElementById("animalLocation").value = animal.location;
    }

    modal.show();
  }

  // Save the animal (either add new or update existing)
  saveAnimal() {
    const name = document.getElementById("animalName").value;
    const size = document.getElementById("animalSize").value;
    const location = document.getElementById("animalLocation").value;
    const index = document.getElementById("animalIndex").value;
    const image = "https://via.placeholder.com/50"; // Placeholder image

    // Add new animal or update existing one
    if (index === "-1") {
      if (this.data.some((animal) => animal.name.toLowerCase() === name.toLowerCase())) {
        alert("Duplicate entry not allowed!");
        return;
      }
      this.data.push({ name, size, location, image });
    } else {
      this.data[index] = { ...this.data[index], name, size, location };
    }

    this.renderTable();
    const modal = bootstrap.Modal.getInstance(document.getElementById("animalModal"));
    modal.hide();
  }

  // Delete an animal from the list
  deleteAnimal(index) {
    this.data.splice(index, 1);
    this.renderTable();
  }
}

// Initialize tables for different species
window.tables = {
  bigCatsTable: new AnimalTable("Big Cats", "bigCatsTable", "./data/big_cats.json", ["name", "size", "location"], "name", "asc"),
  dogsTable: new AnimalTable("Dogs", "dogsTable", "./data/dogs.json", ["name", "location"], "name", "asc"),
  bigFishTable: new AnimalTable("Big Fish", "bigFishTable", "./data/big_fish.json", ["size"], "size", "asc"),
};

// Save button listener
document.getElementById("saveAnimal").addEventListener("click", () => {
  const tableId = document.getElementById("animalTableId").value;
  const currentTable = window.tables[tableId];
  if (currentTable) {
    currentTable.saveAnimal();
  }
});
