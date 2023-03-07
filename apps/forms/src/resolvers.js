import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    getForms: async (_, __, { req }) => {
      if (!req.isAuth) {
        throw new Error("Unauthenticated!");
      }
      return prisma.form.findMany({
        where: {
          // of the same company
          companyId: req.companyId,
        },
        include: {
          company: true,
        },
      });
    },
    getForm: async (_, { id }, context) => {
      const { req } = context;
      if (!req.isAuth) {
        throw new Error("Unauthenticated!");
      }
      return prisma.form.findUnique({
        where: { id },
        include: { company: true, inputs: true },
      });
    },
  },

  Mutation: {
    // Create Form
    createForm: async (
      _,
      { name, title, description },
      context
    ) => {
      const { req } = context;
      if (!req.isAuth) {
        throw new Error("Unauthenticated!");
      }
      const company = await prisma.company.findUnique({
        where: { id: req.companyId },
      });
      if (!company) {
        throw new Error("Company not found");
      }
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
      });
      if (!user) {
        throw new Error("User not found");
      }
      return prisma.form.create({
        data: {
          name,
          title,
          description,
          creator: user.name,
          status: true,
          responses: 0,
          company: { connect: { id: company.id } },
        },
      });
    },

    // Create FormInput
    createFormInput: async (
      _,
      { label, placeholder, type, formId, options },
      context
    ) => {
      const { req } = context;
      if (!req.isAuth) {
        throw new Error("Unauthenticated!");
      }
      const form = await prisma.form.findUnique({ where: { id: formId } });
      if (!form) {
        throw new Error("Form not found");
      }
      const formInput = await prisma.formInput.create({
        data: { label, placeholder, type, form: { connect: { id: form.id } } },
        include: { options: true },
      });
      //si son select o range craemos las options
      if (type === "select" || type === "range") {
        const inputOptionCreatePromises = options.map(async (option) => {
          return prisma.inputOption.create({
            data: {
              value: option.value,
              formInput: { connect: { id: formInput.id } },
            },
          });
        });
        const createdOptions = await Promise.all(inputOptionCreatePromises); // esperamos a todas q todas las option sean creadas para devolverlas
        formInput.options = createdOptions;
      }
      return formInput;
    },

    // Update form: pensar bien como armarlo... la aprte de las options que no se multipliquen.

    // Delete form
  },
  /// RELACIONES
  Company: {
    users: async (parent) => {
      return prisma.user.findMany({ where: { companyId: parent.id } });
    },
    forms: async (parent) => {
      return prisma.form.findMany({ where: { companyId: parent.id } });
    },
  },
  User: {
    company: async (parent) => {
      return prisma.company.findUnique({ where: { id: parent.companyId } });
    },
  },
  Form: {
    company: async (parent) => {
      return prisma.company.findUnique({ where: { id: parent.companyId } });
    },
    inputs: async (parent) => {
      return prisma.formInput.findMany({ where: { formId: parent.id } });
    },
  },
  FormInput: {
    form: async (parent) => {
      return prisma.form.findUnique({ where: { id: parent.formId } });
    },
    options: async (parent) => {
      return prisma.inputOption.findMany({ where: { formInputId: parent.id } });
    },
  },
  InputOption: {
    formInput: async (parent) => {
      return prisma.formInput.findUnique({ where: { id: parent.formInputId } });
    },
  },
};
